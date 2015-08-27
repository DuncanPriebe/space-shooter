'use strict';

// Shouldn't use global variables...
var projectileTimer = 0;
var projectileSpeed = 400;

// Shouldn't use global variables...
var starTime = 0;
var starMinDelay = 300;
var starMaxDelay = 500;
var starSpeed = 150;

 // Create the game object to store objects in the game
var GameObject = new Phaser.Game(800, 600, Phaser.CANVAS, 'game');

// Create the game system to execute functions on objects in the game
var GameSystem = new Phaser.Plugin(GameObject, Phaser.PluginManager);

// Store player data
GameSystem.game.player = {};

// Initialize game values
GameSystem.initialize = function() {
    // Set upper and lower bounds for stats
    GameSystem.game.settings.speedUpperBound *= GameSystem.game.world.height;
    GameSystem.game.settings.speedLowerBound *= GameSystem.game.world.height;
    GameSystem.game.settings.accelerationUpperBound *= GameSystem.game.world.height;
    GameSystem.game.settings.accelerationLowerBound *= GameSystem.game.world.height;
    GameSystem.game.settings.sizeUpperBound *= GameSystem.game.world.height;
    GameSystem.game.settings.sizeLowerBound *= GameSystem.game.world.height;
    GameSystem.game.settings.blastRadiusUpperBound *= GameSystem.game.world.height;
    GameSystem.game.settings.blastRadiusLowerBound *= GameSystem.game.world.height;

    // Store all game projectiles (can't be done before state is loaded?)
    GameSystem.projectiles = GameSystem.game.add.group();
}


// Normalize values into useful bounds
GameSystem.normalize = function(value, lowerBound, upperBound, minValue, maxValue) {
    // If we aren't given values, normalize between 0 and 100
    minValue = (minValue) ? minValue : 0;
    maxValue = (maxValue) ? maxValue : 100;
    return lowerBound + ((value - minValue) * (upperBound - lowerBound) / (maxValue - minValue));
}

// Create an enemy
GameSystem.enemy = function(mission) {
    // Create a random enemy from the available enemies in the mission
    var enemy = {};

    var random = GameSystem.game.rnd.integerInRange(0, mission.enemies.length - 1);

    enemy.level = mission.enemies[random].level;
    enemy.sprite = GameSystem.game.add.sprite(GameSystem.game.world.width / 2, 100, mission.enemies[random].sprite);
    enemy.player.sprite.anchor.setTo(0.5, 0.5);
    enemy.physics.enable(enemy.sprite, Phaser.Physics.ARCADE);
    enemy.player.sprite.body.collideWorldBounds = true;

    // Check if it's a random enemy or preset enemy
    // Set enemy ship, weapons, shields, etc., based on mission level and tileset

    return enemy;
}

// Determine item rarity
GameSystem.rarity = function(source) {
    var chances = [];

    // Load rarity chances
    for (var i in GameSystem.game.rarities) {
        //var chance = source.level * GameSystem.game.rarities[i].dropChanceMultiplier + GameSystem.game.rarities[i].baseDropChance;

        // Determine chance based on item rarity and source level
        var rarity = GameSystem.game.rarities[i];
        var chance = GameSystem.normalize(source.level, rarity.minDropChance, rarity.maxDropChance);
        chances.push(chance);
    }

    var rarity;
    
    // Roll the dice
    var random = GameSystem.game.rnd.integerInRange(0, 100);

    // Check if we have a rare item
    for (var i in chances) {
        if (random < chances[i]) {
            rarity = GameSystem.game.rarities[i]; // Load the rarity
            break;
        }
    }

    // Otherwise choose the most common rarity
    if (typeof rarity == "undefined") {
        rarity = GameSystem.game.rarities[GameSystem.game.rarities.length - 1];
    }

    // Set rarity multiplier
    rarity.statMultiplier = GameSystem.game.rnd.integerInRange(rarity.minStatMultiplier, rarity.maxStatMultiplier);
    rarity.statMultiplier = (rarity.statMultiplier + 100) / 100; // Chance to a decimal for easier math

    return rarity;
}

// Determine if the item has a bonus based on rarity
GameSystem.bonus = function(source, rarity, itemType) {
    var bonus = {};
    bonus.values = [];

    // Store bonus names so we can add them when a stat is chosen
    var bonusNames = [];
    
    // Load bonus stats
    switch (itemType) {
        case "ship":
            bonusNames = GameSystem.game.ships.bonuses;
            break;
        case "weapon":
            bonusNames = GameSystem.game.weapons.bonuses;
            break;
        case "shield":
            bonusNames = GameSystem.game.shields.bonuses;
            break;
        case "engine":
            bonusNames = GameSystem.game.engines.bonuses;
            break;
        case "generator":
            bonusNames = GameSystem.game.generators.bonuses;
            break;
        case "module":
            bonusNames = GameSystem.game.modules.bonuses;
            break;
    }

    // Determine if we have a bonus
    var random = GameSystem.game.rnd.integerInRange(0, 100);

    if (random < rarity.bonusChance) { // We have a bonus

        // Normalize stat bonus based on level and rarity
        var bonusValue = GameSystem.normalize(source.level, rarity.minStatBoost, rarity.maxStatBoost);

        // Choose a random stat to boost
        var random = GameSystem.game.rnd.integerInRange(0, bonusNames.length - 1);
        
        for (var i in bonusNames) {
            if (random == i) { // Boost the stat
                bonus.values.push(bonusValue);
                bonus.name = bonusNames[i];
            } else { // Don't boost the rest
                bonus.values.push(0);
            }
        }
    } else { // We don't have a bonus
        // Fill the array with 0 values
        for (var i in bonusNames) {
            bonus.values.push(0);
            bonus.name = null;
        }
    }
    return bonus;
}

// Generate a random item based on source and type
GameSystem.item = function(source, itemType, rarityIndex) {
    // If we haven't defined the item type, choose one at random
    if (typeof itemType == "undefined") {
        var itemTypes = ["ship", "weapon", "shield", "engine", "generator", "module"];
        var random = GameSystem.game.rnd.integerInRange(0, itemTypes.length - 1);
        itemType = itemTypes[random];
    }

    var rarity;
    
    // If we haven't defined the rarity, choose one at random
    if (typeof rarityIndex == "undefined") {
        rarity = GameSystem.rarity(source);
    } else {
        rarity = GameSystem.game.rarities[rarityIndex];
    }
    
    // Set the bonus
    var bonus = GameSystem.bonus(source, rarity, itemType);

    // Create the item prefix
    var prefix = (bonus.name) ? rarity.name + " " + bonus.name : rarity.name;
    
    var item = {};

    // Load an item template and set stats
    switch (itemType) {
        case "ship":
            // Copy weapon from random template
            random = GameSystem.game.rnd.integerInRange(0, GameSystem.game.ships.types.length - 1);            
            item = JSON.parse(JSON.stringify(GameSystem.game.ships.types[random]));

            item.rarity = rarity.name;
            item.faction = source.faction.name;
            item.name = prefix + " " + source.faction.shipBonus.name + " " + item.type;
            break;
        case "weapon":
            // Copy weapon from random template
            random = GameSystem.game.rnd.integerInRange(0, GameSystem.game.weapons.types.length - 1);            
            item = JSON.parse(JSON.stringify(GameSystem.game.weapons.types[random]));

            item.rarity = rarity.name;
            item.faction = source.faction.name;
            item.name = prefix + " " + source.faction.weaponBonus.name + " " + item.type;
            item.level = source.level;

            // Boost damage so that low level weapons don't all deal 1 damage
            var minDamage = 5;

            // Update weapon states based on source level, rarity and bonus
            item.shieldDamage = Math.ceil(((minDamage + item.level) * rarity.statMultiplier * item.shieldDamage * 0.01) + bonus.values[0]);
            item.armorDamage = Math.ceil(((minDamage + item.level) * rarity.statMultiplier * item.armorDamage * 0.01) + bonus.values[1]);
            item.rateOfFire = Math.ceil((rarity.statMultiplier * item.rateOfFire) + bonus.values[2]);
            item.projectileSpeed = Math.ceil((rarity.statMultiplier * item.projectileSpeed) + bonus.values[3]);
            item.acceleration = Math.ceil((rarity.statMultiplier * item.acceleration) + bonus.values[4]);
            item.projectileSize = Math.ceil((rarity.statMultiplier * item.projectileSize) + bonus.values[5]);
            item.blastRadius = Math.ceil((rarity.statMultiplier * item.blastRadius) + bonus.values[6]);
            item.efficiency = Math.ceil((rarity.statMultiplier * item.efficiency) + bonus.values[7]);

            return item;
            break;
        case "shield":
            // Copy weapon from random template
            random = GameSystem.game.rnd.integerInRange(0, GameSystem.game.shields.types.length - 1);            
            item = JSON.parse(JSON.stringify(GameSystem.game.shields.types[random]));

            item.rarity = rarity.name;
            item.faction = source.faction.name;
            item.name = prefix + " " + source.faction.shieldBonus.name + " " + item.type;
            break;
        case "engine":
            // Copy weapon from random template
            random = GameSystem.game.rnd.integerInRange(0, GameSystem.game.engines.types.length - 1);            
            item = JSON.parse(JSON.stringify(GameSystem.game.shields.types[random]));

            item.rarity = rarity.name;
            item.faction = source.faction.name;
            item.name = prefix + " " + source.faction.shieldBonus.name + " " + item.type;
            break;
        case "generator":
            // Copy weapon from random template
            random = GameSystem.game.rnd.integerInRange(0, GameSystem.game.generators.types.length - 1);            
            item = JSON.parse(JSON.stringify(GameSystem.game.generators.types[random]));

            item.rarity = rarity.name;
            item.faction = source.faction.name;
            item.name = prefix + " " + source.faction.generatorBonus.name + " " + item.type;
            break;
        case "module":
            // Copy weapon from random template
            random = GameSystem.game.rnd.integerInRange(0, GameSystem.game.modules.types.length - 1);            
            item = JSON.parse(JSON.stringify(GameSystem.game.modules.types[random]));

            item.rarity = rarity.name;
            item.faction = source.faction.name;
            item.name = prefix + " " + source.faction.moduleBonus.name + " " + item.type;
            break;
    }
    return item;
}

// Create a projectile
GameSystem.projectile = function(weapon, x, y) {
    // Play the sound of the weapon firing
    var fireSound = GameSystem.game.add.audio(weapon.fireSound, GameSystem.game.settings.sfxVolume);
    fireSound.play();

    // Create the projectile
    var projectile = GameSystem.projectiles.create(x, y, weapon.sprite);
    GameSystem.game.physics.enable(projectile, GameSystem.game.Physics);
    //projectile.physics = GameSystem.game.Physics;
    projectile.anchor.setTo(0.5, 0.5);
    projectile.outOfBoundsKill = true;
    projectile.checkWorldBounds = true;

    // Set projectile stats
    projectile.fireSound = weapon.fireSound;
    projectile.impactSound = weapon.impactSound;
    projectile.type = weapon.type;
    projectile.shieldDamage = weapon.shieldDamage;
    projectile.armorDamage = weapon.armorDamage;

    // Still need to write these...
    //projectile.duration = weapon.duration;
    //projectile.maxDistance = weapon.maxDistance;

    // Normalize values that are based on screen size or time
    var height = GameSystem.game.world.height;

    projectile.maxSpeed = GameSystem.normalize(weapon.projectileSpeed, GameSystem.game.settings.speedLowerBound, GameSystem.game.settings.speedUpperBound, 1, GameSystem.game.settings.statUpperBound);
    projectile.acceleration = GameSystem.normalize(weapon.acceleration, GameSystem.game.settings.accelerationLowerBound, GameSystem.game.settings.accelerationUpperBound, 1, GameSystem.game.settings.statUpperBound);
    projectile.size = GameSystem.normalize(weapon.projectileSize, GameSystem.game.settings.sizeLowerBound, GameSystem.game.settings.sizeUpperBound, 1, GameSystem.game.settings.statUpperBound);
    projectile.blastRadius = GameSystem.normalize(weapon.blastRadius, GameSystem.game.settings.blastRadiusLowerBound, GameSystem.game.settings.blastRadiusUpperBound, 1, GameSystem.game.settings.upperBound);

    // Give the projectile a starting velocity (probably not useful, unless acceleration is revamped)
    //projectile.body.velocity.y = -projectile.maxSpeed;
    return projectile;
}

GameSystem.updateProjectiles = function() {
    // First check if we've reached max distance or duration, that way we kill the projectile as soon as possible
    GameSystem.projectiles.forEachExists(GameSystem.checkProjectileDuration, this);
    GameSystem.projectiles.forEachExists(GameSystem.checkProjectileDistance, this);

    // Update projectile movement, animations, etc.
    GameSystem.projectiles.forEachExists(GameSystem.checkProjectileSpeed, this);

    // Make sure projectiles are on top of other sprites
    GameSystem.game.world.bringToTop(GameSystem.projectiles);
}

GameSystem.checkProjectileSpeed = function(projectile) {
    // Accelerate projectile
    if (projectile.body.velocity.y > -projectile.maxSpeed) { // If it hasn't reached max speed
        if (projectile.body.velocity.y - projectile.acceleration < -projectile.maxSpeed) { // If it surpass max speed
            projectile.body.velocity.y = -projectile.maxSpeed;
        } else { // It won't reach max speed
            projectile.body.velocity.y -= projectile.acceleration;
        }
    }
}

// Check if the projectile's timer has expired
GameSystem.checkProjectileDuration = function(projectile) {
    
}

// Check if the projectile has traveled its maximum distance
GameSystem.checkProjectileDistance = function(projectile) {

}

GameSystem.checkProjectileReady = function(weapon) {
    // If the weapon timer has expired or we haven't fired yet
    if (GameSystem.game.time.now > weapon.time || typeof weapon.time == "undefined") {
        // Set the timer and give the go-ahead to fire
        var delay = GameSystem.normalize(GameSystem.game.settings.statUpperBound - weapon.rateOfFire, 35, 750, 1, GameSystem.game.settings.statUpperBound);
        weapon.time = GameSystem.game.time.now + delay;
        return true;
    }
    // Otherwise don't fire
    return false;
}

// Fire primary weapons
GameSystem.firePrimary = function(shooter) {
    for (var i in shooter.primaryWeapons) {
       if (GameSystem.checkProjectileReady(shooter.primaryWeapons[i])) { // Check if weapon is ready for firing
            GameSystem.projectile(shooter.primaryWeapons[i], shooter.sprite.x, shooter.sprite.y - shooter.sprite.height * .5);
        }
    }
}

// Fire secondary weapons
GameSystem.fireSecondary = function(shooter) {
    for (var i in shooter.secondaryWeapons) {
        if (GameSystem.checkProjectileReady(shooter.secondaryWeapons[i])) { // Check if weapon is ready for firing
           GameSystem.projectile(shooter.secondaryWeapons[i], shooter.sprite.x, shooter.sprite.y - shooter.sprite.height * .5);
        }
    }
}

// Store all text on the screen (so it can be cleared)
GameSystem.game.text = new Array();

// Define class for creating menu structure
GameSystem.node = function(name, type, selected) {
    this.name = name || "node"; // The name to be displayed
    this.type = type || "node"; // The type of node (for executing node command)
    this.parent = {};
    this.selected = selected || false;
    this.children = [];
}

// Select the node
GameSystem.node.prototype.select = function() {        
    var siblings = this.getSiblings();
    for (var i in siblings) {
        siblings[i].deselect(); // Deselect siblings
    }        
    this.selected = true;
}

// Deselect the node
GameSystem.node.prototype.deselect = function() {
    this.selected = false;
}

// Return selected node
GameSystem.node.prototype.getSelected = function() {
	for (var i in this.children) {
		if (this.children[i].selected == true) {
			return this.children[i];
		}
	}
}

// Add a child node
GameSystem.node.prototype.addChild = function(name, type) {
    var child = new GameSystem.node(name, type);
    this.children.push(child);
    child.parent = this;
    
    // If this is the first child of the parent, then select it by default
	if (child.getSiblings().indexOf(child) == 0) {
		child.select();
	}
    return child;
}

// Return siblings of a node (and the node itself)
GameSystem.node.prototype.getSiblings = function() {
    return (typeof this.parent !== "undefined") ? this.parent.children : this; // Return siblings along with the child itself (all children of the parent)
}

// Return first sibling
GameSystem.node.prototype.getFirstSibling = function() {
    var siblings = this.getSiblings();
    var youngest = siblings[0];
    for (var i = siblings.length; i >= 0; i--) {
        if (i < this.getSiblings().indexOf(this)) {
            youngest = siblings[i];
        }
    }
    return youngest;
}

// Return last sibling
GameSystem.node.prototype.getLastSibling = function() {        
    var siblings = this.getSiblings();
    var oldest = siblings[0];
    for (var i in siblings) {
        if (i > this.getSiblings().indexOf(this)) {
            oldest = siblings[i];
        }
    }
    return oldest;
}

// Select the parent (or the current selection)
GameSystem.node.prototype.selectParent = function() {	
	var parent = (this.parent.type != "root") ? this.parent : this;
	parent.select();
	parent.update();
	return parent;
}

// Select previous sibling (or the last sibling)
GameSystem.node.prototype.selectPrevious = function() {
	var previous = (this.getSiblings().indexOf(this) - 1 >= 0) ? this.getSiblings()[this.getSiblings().indexOf(this) - 1] : this.getLastSibling();
	previous.select();
	previous.update();
	return previous;
}

// Select next sibling (or the last sibling)
GameSystem.node.prototype.selectNext = function() {
	var next = (this.getSiblings().indexOf(this) + 1 < this.getSiblings().length) ? this.getSiblings()[this.getSiblings().indexOf(this) + 1] : this.getFirstSibling();
	next.select();
	next.update();
	return next;
}

// Select next child (or the current selection)
GameSystem.node.prototype.selectChild = function() {
	// Show children of selected node, otherwise execute node command
	var child;
	if (this.children.length > 0) {
		child = this.getSelected();
	} else {
		child = this;
		this.execute();
	}
	child.select();
	child.update();
	return child;
}

// Check if node has children
GameSystem.node.prototype.hasChildren = function() {
    return (this.children.length > 0) ? true : false;
}

GameSystem.node.prototype.update = function() {
	for (var i in GameSystem.game.text) {
		GameSystem.game.text[i].destroy();
	}

	var siblings = this.getSiblings();

	GameSystem.game.text.push(GameSystem.game.add.text(80, 150, this.parent.name, GameSystem.game.menu.fonts.menu)); // Add the current menu name

	for (var i in siblings) {
		var font = (siblings[i].selected) ? GameSystem.game.menu.fonts.selected : GameSystem.game.menu.fonts.unselected;
		GameSystem.game.text.push(GameSystem.game.add.text(80, i * 30 + 200, siblings[i].name, font)); // Add menu children names
	}
}

// Execute node command
GameSystem.node.prototype.execute = function() {
	//console.log("Selected: " + this.name + ", Type: " + this.type);

    if (this.type == "mission") { // We're launching a mission
        var mission;
        for (var i in GameSystem.game.missions) {
            if (this.name == GameSystem.game.missions[i].name) {
                mission = GameSystem.game.missions[i];
            }
        }
        GameSystem.game.state.start("play", true, false, mission);
    } else { // We're doing something else
        switch (this.name) {
            case "NEW GAME": // Start new game
                GameSystem.storage.reset();
                GameSystem.game.state.start("dock", true, false, GameSystem.game.docks[0]);
                break;
            case "CONTINUE": // Continue game
                GameSystem.storage.load();
                break;
            case "SAVE GAME": // Save game
                GameSystem.storage.save();
                break;
            case "RESET GAME": // Reset game
                GameSystem.storage.reset();
                break;
            case "ERASE DATA": // Erase game
                GameSystem.storage.erase();
                break;
            case "QUIT": // Quit current menu
                if (GameSystem.game.state.current == "menu") { // If we're in the main menu, exit the game
                    console.log("Exiting game...");
                } else if (GameSystem.game.state.current == "dock") { // If we're in a dock, go to the main menu
                    GameSystem.game.state.start('menu');
                }
                break;
        }
    }
}

// Load state assets
GameSystem.loadStateAssets = function(stateKey) {
    // Determine which state we're in
    var state = GameSystem.game.assets[stateKey];

    // Need to add checks to see if the asset is already loaded (because states use the same assets and we go back and forth between states)

    // Load assets
    for (var data in state) {
        for (var key in state[data]) {
            if (state[data].hasOwnProperty(key)) {
                if (key == "sprites") { // We're loading video
                    for (var i in state[data].sprites) {
                        if (state[data].sprites[i].sheet == true) { // We have an animation
                            GameSystem.game.load.spritesheet(state[data].sprites[i].key, GameSystem.game.settings.imagePath + state[data].sprites[i].file, state[data].sprites[i].width, state[data].sprites[i].height);
                        } else { // We have a single image
                            GameSystem.game.load.image(state[data].sprites[i].key, GameSystem.game.settings.imagePath + state[data].sprites[i].file);    
                        }
                    }     
                } else if (key == "audio") { // We're loading audio
                    for (var i in state[data].audio) {
                        GameSystem.game.load.audio(state[data].audio[i].key, GameSystem.game.settings.audioPath + state[data].audio[i].file);
                    }
                }
            }
        }
    }
}

// Manage web storage
GameSystem.storage = {};

// Load data from web storage
GameSystem.storage.load = function() {
    var gameData;

    // Verify web storage and existing data
    if (typeof Storage !== "undefined") {
        // Load data from web storage
        gameData = localStorage.getItem(GameSystem.game.settings.webStorageName);

        if (gameData !== null) { // Need to test for valid game data (and same version of game)
            console.log("Loading game data from web storage.");
            
            // Parse data into an object
            gameData = JSON.parse(gameData);
        } else {
            console.log("Nonexistant or corrupt game data in web storage. Unable to load game data.");
        }
    } else {
        console.log("Web storage not supported. Unable to load game data.");
    }
}

// Save data to web storage
GameSystem.storage.save = function() {
    console.log("Saving game data to web storage.");
    if (typeof Storage !== "undefined") { // Verify web storage support

        // Store current game data as a stringified object
        var gameData = {
            'ship': GameSystem.game.player.ship,
            'weapons': GameSystem.game.player.weapons,
            'shield': GameSystem.game.player.shield,
            'generator': GameSystem.game.player.generator,
            'engine': GameSystem.game.player.engine,
            'modules': GameSystem.game.player.modules,
            'dock': GameSystem.game.player.dock,
            'money': GameSystem.game.player.money
        };

        // Put data into web storage
        localStorage.setItem(GameSystem.game.settings.webStorageName, JSON.stringify(gameData));
    } else {
        console.log("Web storage not supported. Unable to load game data.");
    }
}

// Reset data in memory
GameSystem.storage.reset = function() {
    console.log("Resetting game data in memory.");
    GameSystem.game.player = {};
    GameSystem.game.player.ship = {};
    GameSystem.game.player.primaryWeapons = [];
    GameSystem.game.player.secondaryWeapons = [];
    GameSystem.game.player.shield = {};
    GameSystem.game.player.generator = {};
    GameSystem.game.player.engine = {};
    GameSystem.game.player.modules = [];
    GameSystem.game.player.dock = GameSystem.game.docks[0];
    GameSystem.game.player.money = GameSystem.game.settings.startingMoney;
}

// Reset data in web storage
// Probably don't need this function because the only time you 'erase' web storage is by overriding it with a new game (saving)
GameSystem.storage.erase = function() {
    console.log("Erasing web storage.");
    if (typeof Storage !== "undefined") { // Verify web storage support
        localStorage.removeItem(GameSystem.game.settings.webStorageName); // Delete data in web storage

        // Store game data as a stringified object
        var gameData = {
            'ship': {},
            'primaryWeapons': [],
            'secondaryWeapons': [],
            'shield': {},
            'generator': {},
            'engine': {},
            'modules': [],
            'dock': {},
            'money': GameSystem.game.settings.startingMoney
        };

        localStorage.setItem(GameSystem.game.settings.webStorageName, JSON.stringify(gameData)); // Put data into web storage

        GameSystem.storage.reset();
    } else {
        console.log("Web storage not supported. Unable to load game data.");
    }
}

// Convert a value to money
GameSystem.monify = function(n, c, d, t) {
    var c = isNaN(c = Math.abs(c)) ? 0 : c,
        d = d == undefined ? "" : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "", 
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
}

GameSystem.game.state.add('boot', bootState);
GameSystem.game.state.add('preload', preloadState);
GameSystem.game.state.add('menu', menuState);
GameSystem.game.state.add('dock', dockState);
GameSystem.game.state.add('play', playState);
GameSystem.game.state.add('win', winState);

GameSystem.game.state.start('boot');