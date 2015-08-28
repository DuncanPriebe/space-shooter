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
    GameSystem.data.settings.speedUpperBound *= GameSystem.game.world.height;
    GameSystem.data.settings.speedLowerBound *= GameSystem.game.world.height;
    GameSystem.data.settings.accelerationUpperBound *= GameSystem.game.world.height;
    GameSystem.data.settings.accelerationLowerBound *= GameSystem.game.world.height;
    GameSystem.data.settings.sizeUpperBound *= GameSystem.game.world.height;
    GameSystem.data.settings.sizeLowerBound *= GameSystem.game.world.height;
    GameSystem.data.settings.blastRadiusUpperBound *= GameSystem.game.world.height;
    GameSystem.data.settings.blastRadiusLowerBound *= GameSystem.game.world.height;

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

GameSystem.item = function(source, itemType, rarity) {
    var item;

    // If unspecified, get a random type
    var itemTemplate;
    var itemTypes = Object.keys(GameSystem.data.items);
    if (typeof itemType == "undefined") {
        var random = GameSystem.game.rnd.integerInRange(0, itemTypes.length - 1);
        itemTemplate = GameSystem.data.items[itemTypes[random]];
    } else {
        // Otherwise load type
        for (var i in itemTypes) {
            if (itemType == itemTypes[i]) {
                itemTemplate = GameSystem.data.items[itemTypes[i]];
            }
        }
    }
    // Get random preset
    var random = GameSystem.game.rnd.integerInRange(0, itemTemplate.presets.length - 1);
    item = JSON.parse(JSON.stringify(itemTemplate.presets[random]));

    item.level = source.level;

    // If unspecified, get a random faction
    if (typeof source.faction == "undefined") {
        var random = GameSystem.game.rnd.integerInRange(0, GameSystem.data.factions.length - 1);
        for (var i in GameSystem.data.factions) {
            if (random == i) {
                item.faction = GameSystem.data.factions[i];
            }
        }
    } else {
        // Otherwise load faction
        item.faction = source.faction;
    }

    // If unspecified, get a random rarity
    if (typeof rarity == "undefined") {
        var random = GameSystem.game.rnd.integerInRange(0, 100);
        for (var i in GameSystem.data.items.rarities) {
            if (random <= GameSystem.data.items.rarities[i].dropChance) {
                //console.log("Success! We rolled a " + random + " and we were looking for a " + GameSystem.data.items.rarities[i].dropChance + ", which means our item is " + GameSystem.data.items.rarities[i].name);
                item.rarity = GameSystem.data.items.rarities[i];
                break;
            }
        }
    } else {
        // Otherwise load rarity
        for (var i in rarities) {
            if (rarity == rarities[i]) {
                item.rarity = GameSystem.data.items.rarities[i];
            }
        }
    }

    // If we roll a bonus, choose a stat to boost
    item.rarity.statBonuses = [];
    var random = GameSystem.game.rnd.integerInRange(0, 100);    
    if (random < item.rarity.bonusChance) {
        var random = GameSystem.game.rnd.integerInRange(0, itemTemplate.bonusNames.length - 1);
        for (var i in itemTemplate.bonusNames) {
            if (random == i) {
                item.rarity.statBonuses.push(GameSystem.game.rnd.integerInRange(item.rarity.minStatBoost, item.rarity.maxStatBoost));
                item.rarity.bonusName = itemTemplate.bonusNames[i];
            } else {
                item.rarity.statBonuses.push(0);
            }
        }
    } else {
        // Otherwise set all stats to 0
        for (var i in itemTemplate.bonusNames) {
            item.rarity.statBonuses.push(0);
        }
    }

    // Check if we have a special (add later)

    // Set item name
    var name = item.name;
    if (typeof item.rarity.bonusName == "undefined") {
        item.name = item.rarity.name + " " + item.faction.itemName + " " + item.name;
    } else {
        item.name = item.rarity.name + " " + item.rarity.bonusName + " " + item.faction.itemName + " " + item.name;
    }

    // Update weapon states based on source level, rarity and bonus
    var counter = 0;
    for (var i in item.stats) {
        var statMultiplier = (GameSystem.game.rnd.integerInRange(item.rarity.minStatMultiplier, item.rarity.maxStatMultiplier) + 100) / 100;
        item.stats[i] = item.stats[i] * statMultiplier + item.rarity.statBonuses[counter];
        counter++;
    }
    
    return item;
}

// Create a projectile
GameSystem.projectile = function(weapon, x, y) {
    // Play the sound of the weapon firing
    var fireSound = GameSystem.game.add.audio(weapon.fireSound, GameSystem.data.settings.sfxVolume);
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
    projectile.shieldDamage = weapon.stats.shieldDamage;
    projectile.armorDamage = weapon.stats.armorDamage;

    // Still need to write these...
    //projectile.duration = weapon.duration;
    //projectile.maxDistance = weapon.maxDistance;

    // Normalize values that are based on screen size or time
    var height = GameSystem.game.world.height;

    projectile.maxSpeed = GameSystem.normalize(weapon.stats.projectileSpeed, GameSystem.data.settings.speedLowerBound, GameSystem.data.settings.speedUpperBound, 1, GameSystem.data.settings.statUpperBound);
    projectile.acceleration = GameSystem.normalize(weapon.stats.acceleration, GameSystem.data.settings.accelerationLowerBound, GameSystem.data.settings.accelerationUpperBound, 1, GameSystem.data.settings.statUpperBound);
    projectile.size = GameSystem.normalize(weapon.stats.projectileSize, GameSystem.data.settings.sizeLowerBound, GameSystem.data.settings.sizeUpperBound, 1, GameSystem.data.settings.statUpperBound);
    projectile.blastRadius = GameSystem.normalize(weapon.stats.blastRadius, GameSystem.data.settings.blastRadiusLowerBound, GameSystem.data.settings.blastRadiusUpperBound, 1, GameSystem.data.settings.upperBound);

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
        var delay = GameSystem.normalize(GameSystem.data.settings.statUpperBound - weapon.stats.rateOfFire, 35, 750, 1, GameSystem.data.settings.statUpperBound);
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

	GameSystem.game.text.push(GameSystem.game.add.text(80, 150, this.parent.name, GameSystem.data.menu.fonts.menu)); // Add the current menu name

	for (var i in siblings) {
		var font = (siblings[i].selected) ? GameSystem.data.menu.fonts.selected : GameSystem.data.menu.fonts.unselected;
		GameSystem.game.text.push(GameSystem.game.add.text(80, i * 30 + 200, siblings[i].name, font)); // Add menu children names
	}
}

// Execute node command
GameSystem.node.prototype.execute = function() {
	//console.log("Selected: " + this.name + ", Type: " + this.type);

    if (this.type == "mission") { // We're launching a mission
        var mission;
        for (var i in GameSystem.data.missions) {
            if (this.name == GameSystem.data.missions[i].name) {
                mission = GameSystem.data.missions[i];
            }
        }
        GameSystem.game.state.start("play", true, false, mission);
    } else { // We're doing something else
        switch (this.name) {
            case "NEW GAME": // Start new game
                GameSystem.storage.reset();
                GameSystem.game.state.start("dock", true, false, GameSystem.data.docks[0]);
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
    var state = GameSystem.data.assets[stateKey];

    // Need to add checks to see if the asset is already loaded (because states use the same assets and we go back and forth between states)

    // Load assets
    for (var data in state) {
        for (var key in state[data]) {
            if (state[data].hasOwnProperty(key)) {
                if (key == "sprites") { // We're loading video
                    for (var i in state[data].sprites) {
                        if (state[data].sprites[i].sheet == true) { // We have an animation
                            GameSystem.game.load.spritesheet(state[data].sprites[i].key, GameSystem.data.settings.imagePath + state[data].sprites[i].file, state[data].sprites[i].width, state[data].sprites[i].height);
                        } else { // We have a single image
                            GameSystem.game.load.image(state[data].sprites[i].key, GameSystem.data.settings.imagePath + state[data].sprites[i].file);    
                        }
                    }     
                } else if (key == "audio") { // We're loading audio
                    for (var i in state[data].audio) {
                        GameSystem.game.load.audio(state[data].audio[i].key, GameSystem.data.settings.audioPath + state[data].audio[i].file);
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
        gameData = localStorage.getItem(GameSystem.data.settings.webStorageName);

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
        localStorage.setItem(GameSystem.data.settings.webStorageName, JSON.stringify(gameData));
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
    GameSystem.game.player.dock = GameSystem.data.docks[0];
    GameSystem.game.player.money = GameSystem.data.settings.startingMoney;
}

// Reset data in web storage
// Probably don't need this function because the only time you 'erase' web storage is by overriding it with a new game (saving)
GameSystem.storage.erase = function() {
    console.log("Erasing web storage.");
    if (typeof Storage !== "undefined") { // Verify web storage support
        localStorage.removeItem(GameSystem.data.settings.webStorageName); // Delete data in web storage

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
            'money': GameSystem.data.settings.startingMoney
        };

        localStorage.setItem(GameSystem.data.settings.webStorageName, JSON.stringify(gameData)); // Put data into web storage

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