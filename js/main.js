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

// Store player sprite
GameSystem.playerSprite = {};

// Store player data
GameSystem.playerEntity = {};

// Manage web storage
GameSystem.storage = {};

// Manage game menu
GameSystem.menu = {};
GameSystem.menu.audio = {};

// Store all text and boxes on the screen, so they can be cleared
GameSystem.game.text = new Array();

// Initialize game settings, fonts, groups, sprites, etc.
GameSystem.initialize = function(content) {
    switch (content) {
        case "bounds":
            // Set upper and lower bounds for sprites based on screen size
            if (!GameSystem.initializedBounds) {
                GameSystem.data.settings.projectileSpeedUpperBound *= GameSystem.game.world.height;
                GameSystem.data.settings.projectileSpeedLowerBound *= GameSystem.game.world.height;
                GameSystem.data.settings.projectileAccelerationUpperBound *= GameSystem.game.world.height;
                GameSystem.data.settings.projectileAccelerationLowerBound *= GameSystem.game.world.height;
                GameSystem.data.settings.engineSpeedUpperBound *= GameSystem.game.world.height;
                GameSystem.data.settings.engineSpeedLowerBound *= GameSystem.game.world.height;
                GameSystem.data.settings.engineAccelerationUpperBound *= GameSystem.game.world.height;
                GameSystem.data.settings.engineAccelerationLowerBound *= GameSystem.game.world.height;
                GameSystem.data.settings.sizeUpperBound *= GameSystem.game.world.height;
                GameSystem.data.settings.sizeLowerBound *= GameSystem.game.world.height;
                
                // May not need due to sprite scaling
                //GameSystem.data.settings.blastRadiusUpperBound *= GameSystem.game.world.height;
                //GameSystem.data.settings.blastRadiusLowerBound *= GameSystem.game.world.height;

                GameSystem.initializedBounds = true;
            }    
            break;
        case "groups": {
            // Create groups (must be done after preloading)
            if (!GameSystem.initializedGroups) {
                GameSystem.playerProjectiles = GameSystem.game.add.group();
                GameSystem.enemyProjectiles = GameSystem.game.add.group();
                GameSystem.enemies = GameSystem.game.add.group();
                GameSystem.explosions = GameSystem.game.add.group();

                GameSystem.initializedGroups = true;
            }
        }
        case "fonts": {
            // Set text width based on screen size
            if (!GameSystem.initializedFonts) {
                for (var i in GameSystem.data.menu.fonts) {
                    GameSystem.data.menu.fonts[i].wordWrapWidth *= GameSystem.game.world.width;
                    GameSystem.data.menu.fonts[i].xPosition *= GameSystem.game.world.width;
                    GameSystem.data.menu.fonts[i].yPosition *= GameSystem.game.world.height;
                    if (typeof GameSystem.data.menu.fonts[i].ySpacing !== "undefined") {
                        GameSystem.data.menu.fonts[i].ySpacing *= GameSystem.game.world.height;
                    }
                }

                GameSystem.initializedFonts = true;
            }        
        }
    }
}

// Create a world
GameSystem.world = function(index) {
    var world = JSON.parse(JSON.stringify(GameSystem.data.worlds[index]));
    world.index = index;
    var found = false;
    for (var i in GameSystem.data.factions) {
        if (GameSystem.data.factions[i].key == world.faction) {
            world.faction = GameSystem.data.factions[i];
            found = true;
        }
    }
    if (!found) {
        world.faction = GameSystem.data.factions[0];
    }
    return world;  
}

// Create a mission
GameSystem.mission = function(world, randomFlag) {
    var mission = {};
    var missionPreset;

    // We're loading the mission from the world data
    if (!randomFlag) {
        mission = JSON.parse(JSON.stringify(world.mission));
        mission.level = world.level;
        mission.faction = world.faction;
        for (var i in GameSystem.data.missions.presets) {
            if (mission.preset == GameSystem.data.missions.presets[i].name) {
                missionPreset = GameSystem.data.missions.presets[i];
                break;
            }
        }
    } else {
        // Choose a mission type at random
        mission.level = world.level;
        mission.faction = world.faction;
        var random = GameSystem.game.rnd.integerInRange(0, GameSystem.data.missions.presets.length - 1);
        missionPreset = GameSystem.data.missions.presets[random];
    }
    
    // Check what type of mission we're playing and load settings
    switch (missionPreset.name) {
        case "killEnemies":
            mission.checkEnemiesSpawned = false;
            mission.checkEnemiesKilled = true;
            mission.checkBossesKilled = false;
            mission.checkDuration = false;
            mission.checkAlliesKilled = false;
            break;
        case "killBosses":
            mission.checkEnemiesSpawned = false;
            mission.checkEnemiesKilled = false;
            mission.checkBossesKilled = true;
            mission.checkDuration = false;
            mission.checkAlliesKilled = false;
            break;
        case "surviveEnemies":
            mission.checkEnemyCount = false;
            mission.checkEnemiesKilled = false;
            mission.checkBossesKilled = false;
            mission.checkDuration = true;
            mission.checkAlliesKilled = false;
            break;
        case "surviveDuration":
            mission.checkEnemyCount = false;
            mission.checkEnemiesKilled = false;
            mission.checkBossesKilled = false;
            mission.checkDuration = true;
            mission.checkAlliesKilled = false;
            break;
        case "escort":
            mission.checkEnemyCount = true;
            mission.checkEnemiesKilled = false;
            mission.checkBossesKilled = false;
            mission.checkDuration = true;
            mission.checkAlliesKilled = true;
            break;
        case "rescue":
            mission.checkEnemyCount = true;
            mission.checkEnemiesKilled = false;
            mission.checkBossesKilled = false;
            mission.checkDuration = false;
            mission.checkAlliesKilled = true;
            break;
    }

    // Set the index to the first enemy
    mission.enemiesSpawned = 0;
    mission.enemiesKilled = 0;
    mission.bossesSpawned = 0;
    mission.bossesKilled = 0;

    // Set stats based on mission type
    mission.enemiesRemaning = GameSystem.game.rnd.integerInRange(missionPreset.minEnemyCount, missionPreset.enemyCountMultiplier * mission.level);
    mission.maxEnemyDelay = missionPreset.maxEnemyDelay * 1000;
    mission.minEnemyDelay = mission.maxEnemyDelay - missionPreset.enemyDelayMultiplier * mission.level * 1000;
    mission.bossesRemaining = GameSystem.game.rnd.integerInRange(missionPreset.minBossCount, missionPreset.bossCountMultiplier * mission.level);
    mission.duration = GameSystem.game.rnd.integerInRange(missionPreset.minDuration, missionPreset.durationMultiplier * mission.level);

    // Set mission Name
    if (typeof mission.name == "undefined") {
        mission.name = missionPreset.prefix + " " + mission.faction.name + " " + missionPreset.suffix;
    }

    // Set mission timer
    mission.time = GameSystem.game.time.now + mission.duration * 1000;

    // Set cluster flag and delay
    mission.clusterFlag = false;
    mission.clusterTime = 0;
    mission.clusterEnemiesRemaining = 0;
    mission.clusterEnemyPreset;
    mission.clusterSpawnX = -1; // Set to negative one so that we know to reset it

    // Set first enemy delay
    mission.enemyTime = GameSystem.game.time.now + mission.maxEnemyDelay;
    
    return mission;
}

// Create enemies based on mission
GameSystem.enemyFactory = function(mission) {
    // Check if the mission is over
    if (mission.checkEnemyCount) {  // Check if we're out of enemies
        if (mission.enemiesSpawned > mission.enemiesRemaning) {
            console.log("Mission is out of enemies.");
        }
    } 
    if (mission.checkEnemiesKilled) { // Check if enemies are dead
        if (mission.enemiesKilled >= mission.enemiesRemaning) {
            console.log("All enemies are dead.");
        }
    } 
    if (mission.checkBossesKilled) { // Check if boss(es) are dead
        if (mission.bossesKilled >= mission.bossesRemaning) {
            console.log("All bosses are dead.");
        }
    } 
    if (mission.checkDuration) { // Check if time has run out
        if (Game.time.now > mission.time) {
            console.log("Mission timer has expired.");
        }
    } 
    // Create an enemy, cluster, or boss
    // Now check if we're in the middle of spawning a cluster
    if (mission.clusterFlag) {
        if (GameSystem.game.time.now > mission.clusterTime) {
            // Need to somehow load the same enemy for the entire cluster...

            // Choose a spawn location
            if (mission.clusterSpawnX == -1) {
                mission.clusterSpawnX = GameSystem.game.rnd.integerInRange(0, GameSystem.game.world.width);    
            }
            var spawnY = 50;
            
            var clusterEnemy = GameSystem.enemy(mission, mission.clusterEnemyType.name, mission.clusterSpawnX, spawnY);

            mission.clusterTime = GameSystem.game.time.now + mission.clusterDelay;
            mission.clusterEnemiesRemaining--;
            if (mission.clusterEnemiesRemaining == 0) {
                mission.clusterFlag = false;
                mission.clusterSpawnX = -1; // Return to negative value for reset

                // Reset mission enemy timer
                mission.enemyTime = GameSystem.game.time.now + GameSystem.game.rnd.integerInRange(mission.minEnemyDelay, mission.maxEnemyDelay);
            }
        }
    } else if (GameSystem.game.time.now > mission.enemyTime) { // Otherwise check if it's time to make an enemy
        var enemyType;
        var random = GameSystem.game.rnd.integerInRange(0, 100);
        for (var i in GameSystem.data.enemies.presets) {
            if (random <= GameSystem.data.enemies.presets[i].spawnChance) {
                enemyType = GameSystem.data.enemies.presets[i];
                break;
            }
        }

        // Check if we have a cluster of enemies and determine cluster size and delay
        var random = GameSystem.game.rnd.integerInRange(0, 100);
        if (random < enemyType.clusterChance) {
            mission.clusterFlag = true;
            mission.clusterEnemiesRemaining = GameSystem.game.rnd.integerInRange(enemyType.minClusterSize, enemyType.minClusterSize + enemyType.clusterSizeMultiplier * mission.level);
            mission.clusterDelay = enemyType.clusterDelay;
            mission.clusterEnemyType = enemyType;
            console.log("Spawning a cluster of " + mission.clusterEnemiesRemaining + " " + enemyType.name + "s.");
        } else {
            // Choose a spawn location
            var spawnX = GameSystem.game.rnd.integerInRange(0, GameSystem.game.world.width);
            var spawnY = 50;

            // Spawn the enemy
            var enemy = GameSystem.enemy(mission, enemyType.name, spawnX, spawnY);
            //console.log(enemy);

            // Track number of bosses or enemies spawned
            if (enemyType.name == "boss") {
                mission.bossesSpawned++;    
            } else {
                mission.enemiesSpawned++;
            }

            // Reset mission enemy timer
            mission.enemyTime = GameSystem.game.time.now + GameSystem.game.rnd.integerInRange(mission.minEnemyDelay, mission.maxEnemyDelay);
            console.log("Spawning one " + enemyType.name + ".");    
        }
    }
}

// Create an enemy
GameSystem.enemy = function(mission, preset, spawnX, spawnY) {
    // Store the preset
    var enemyPreset;

    // Create the entity based on the mission
    var entity = new GameSystem.entity(mission);

    var enemy = GameSystem.enemies.create(spawnX, spawnY, entity.ship.sprite);
    var tintColor = "0x" + entity.ship.tintColor;
    enemy.entity = entity;
    enemy.preset = preset;
    enemy.angle = 180;
    enemy.tint = tintColor;
    GameSystem.game.physics.enable(enemy, GameSystem.game.Physics);
    enemy.anchor.setTo(0.5, 0.5);
    //enemy.outOfBoundsKill = true;
    //enemy.checkWorldBounds = true;

    // Modify the entity stats based on enemy preset
    for (var i in entity.primaryWeapons) {
        entity.primaryWeapons[i].stats["Shield Damage"] *= GameSystem.data.settings.enemyDamageMultiplier;
        entity.primaryWeapons[i].stats["Armor Damage"] *= GameSystem.data.settings.enemyDamageMultiplier;
    }

    // Load enemy preset or choose one at random
    if (typeof preset != "undefined") {
        for (var i in GameSystem.data.enemies.presets) {
            if (preset == GameSystem.data.enemies.presets[i].name) {
                enemyPreset = GameSystem.data.enemies.presets[i];
                break;
            }
        }
    }

    // If we didnt' find one
    if (typeof enemyPreset == "undefined") {
        var random = GameSystem.game.rnd.integerInRange(0, GameSystem.data.enemies.presets.length - 1);
        enemyPreset = GameSystem.data.enemies.presets[random];
    }
    
    // Set enemy size based on type
    enemy.scale.setTo(enemyPreset.scale, enemyPreset.scale);
    
    return enemy;
}

// Create an entity with weapons, shield, etc.
GameSystem.entity = function(source, rarity) {
    this.primaryWeapons = [];
    this.secondaryWeapons = [];
    this.modules = [];
    this.ship = new GameSystem.item(source, "ships", rarity);
    for (var i = 0; i < this.ship.primaryWeaponSlots; i++) {
        this.primaryWeapons.push(GameSystem.item(source, "weapons", rarity));
    }
    for (var i  = 0; i < this.ship.secondaryWeaponSlots; i++) {
        this.secondaryWeapons.push(GameSystem.item(source, "weapons", rarity));
    }
    this.shield = new GameSystem.item(source, "shields", rarity);
    this.engine = new GameSystem.item(source, "engines", rarity);
    this.generator = new GameSystem.item(source, "generators", rarity);
    for (var i = 0; i < this.ship.moduleSlots; i++) {
        this.modules.push(new GameSystem.item(source, "modules", rarity));
    }
}

// Fire primary weapons
GameSystem.entity.prototype.firePrimary = function(sprite) {
    // First check if we've fired secondary weapons recently
    if (typeof this.weaponSecondaryTime == "undefined" || GameSystem.game.time.now > this.weaponSecondaryTime) {
        // Attempt to fire all primary weapons
        for (var i in this.primaryWeapons) {
            if (GameSystem.checkProjectileReady(this.primaryWeapons[i])) {
                GameSystem.projectile(this.primaryWeapons[i], sprite);
            }
        }
        this.weaponPrimaryTime = GameSystem.game.time.now + GameSystem.data.settings.firingDelay;
    }
}

// Fire secondary weapons
GameSystem.entity.prototype.fireSecondary = function(sprite) {
    // First check if we've fired secondary weapons recently
    if (typeof this.weaponPrimaryTime == "undefined" || GameSystem.game.time.now > this.weaponPrimaryTime) {
        // Attempt to fire all secondary weapons
        for (var i in this.secondaryWeapons) {
            if (GameSystem.checkProjectileReady(this.secondaryWeapons[i])) {
                GameSystem.projectile(this.secondaryWeapons[i], sprite);
            }
        }
        this.weaponSecondaryTime = GameSystem.game.time.now + GameSystem.data.settings.firingDelay;
    }
}

// Move a ship
GameSystem.entity.prototype.move = function(sprite, direction) {
    // Set movement information based on engine stats
    sprite["Maximum Vertical Speed"] = GameSystem.normalize(this.engine.stats["Maximum Vertical Speed"], GameSystem.data.settings.engineSpeedLowerBound, GameSystem.data.settings.engineSpeedUpperBound, 1, GameSystem.data.settings.statUpperBound);
    sprite["Vertical Acceleration"] = GameSystem.normalize(this.engine.stats["Vertical Acceleration"], GameSystem.data.settings.engineAccelerationLowerBound, GameSystem.data.settings.engineAccelerationUpperBound, 1, GameSystem.data.settings.statUpperBound);
    sprite["Maximum Horizontal Speed"] = GameSystem.normalize(this.engine.stats["Maximum Horizontal Speed"], GameSystem.data.settings.engineSpeedLowerBound, GameSystem.data.settings.engineSpeedUpperBound, 1, GameSystem.data.settings.statUpperBound);
    sprite["Horizontal Acceleration"] = GameSystem.normalize(this.engine.stats["Horizontal Acceleration"], GameSystem.data.settings.engineAccelerationLowerBound, GameSystem.data.settings.engineAccelerationUpperBound, 1, GameSystem.data.settings.statUpperBound);

    // Check what direction we're moving
    switch (direction) {
        case "forward":
            // Existing x and y velocities
            var oldSpeedX = sprite.body.velocity.x;
            var oldSpeedY = sprite.body.velocity.y;

            // New x and y velocities after being accelerated according to angle of sprite
            var newSpeedX = sprite.body.velocity.x + Math.cos(sprite.rotation - 90 * Math.PI / 180) * sprite["Vertical Acceleration"];
            var newSpeedY = sprite.body.velocity.y + Math.sin(sprite.rotation - 90 * Math.PI / 180) * sprite["Vertical Acceleration"];

            //var newSpeed = Math.sqrt((Math.pow(newSpeedX, 2) + Math.pow(newSpeedY, 2)));
            //console.log("Moving: " + direction + ", Velocity: " + newSpeedX + ", " + newSpeedY + ", NewSpeed: " + newSpeed);

            sprite.body.velocity.x = newSpeedX;
            sprite.body.velocity.y = newSpeedY;


            break;
        case "backward":
            var newSpeedX = sprite.body.velocity.x + Math.cos(sprite.rotation + 90 * Math.PI / 180) * sprite["Vertical Acceleration"];
            var newSpeedY = sprite.body.velocity.y + Math.sin(sprite.rotation + 90 * Math.PI / 180) * sprite["Vertical Acceleration"];

            //var newSpeed = Math.sqrt((Math.pow(newSpeedX, 2) + Math.pow(newSpeedY, 2)));
            //console.log("Moving: " + direction + ", Velocity: " + newSpeedX + ", " + newSpeedY + ", NewSpeed: " + newSpeed);
            
            sprite.body.velocity.x = newSpeedX;
            sprite.body.velocity.y = newSpeedY;
            break;
        case "stopVertical":
            /*
            if (sprite.body.velocity.y > 0) {
                var newSpeed = sprite.body.velocity.y + -sprite["Vertical Acceleration"] * GameSystem.data.settings.brakeRatio;
                if (newSpeed < 0) {
                    newSpeed = 0;
                }
                sprite.body.velocity.y = newSpeed;
            } else if (sprite.body.velocity.y < 0) {
                var newSpeed = sprite.body.velocity.y + sprite["Vertical Acceleration"] * GameSystem.data.settings.brakeRatio;
                if (newSpeed > 0) {
                    newSpeed = 0;
                }
                sprite.body.velocity.y = newSpeed;
            }
            */
            break;
        case "left":
            var newSpeedX = sprite.body.velocity.x + Math.cos(sprite.rotation - 180 * Math.PI / 180) * sprite["Horizontal Acceleration"];
            var newSpeedY = sprite.body.velocity.y + Math.sin(sprite.rotation - 180 * Math.PI / 180) * sprite["Horizontal Acceleration"];

            //var newSpeed = Math.sqrt((Math.pow(newSpeedX, 2) + Math.pow(newSpeedY, 2)));
            //console.log("Moving: " + direction + ", Velocity: " + newSpeedX + ", " + newSpeedY + ", NewSpeed: " + newSpeed);
            
            sprite.body.velocity.x = newSpeedX;
            sprite.body.velocity.y = newSpeedY;
            break;
        case "right":
            var newSpeedY = sprite.body.velocity.y + Math.sin(sprite.rotation + 0 * Math.PI / 180) * sprite["Horizontal Acceleration"];
            var newSpeedX = sprite.body.velocity.x + Math.cos(sprite.rotation + 0 * Math.PI / 180) * sprite["Horizontal Acceleration"];

            //var newSpeed = Math.sqrt((Math.pow(newSpeedX, 2) + Math.pow(newSpeedY, 2)));
            //console.log("Moving: " + direction + ", Velocity: " + newSpeedX + ", " + newSpeedY + ", NewSpeed: " + newSpeed);
            
            sprite.body.velocity.x = newSpeedX;
            sprite.body.velocity.y = newSpeedY;
            break;
        case "stopHorizontal":
            /*
            if (sprite.body.velocity.x > 0) {
                var newSpeed = sprite.body.velocity.x + -sprite["Horizontal Acceleration"] * GameSystem.data.settings.brakeRatio;
                if (newSpeed < 0) {
                    newSpeed = 0;
                }
                sprite.body.velocity.x = newSpeed;
            } else if (sprite.body.velocity.x < 0) {
                var newSpeed = sprite.body.velocity.x + sprite["Horizontal Acceleration"] * GameSystem.data.settings.brakeRatio;
                if (newSpeed > 0) {
                    newSpeed = 0;
                }
                sprite.body.velocity.x = newSpeed;
            }
            */
            break;
    }
}

// Return the vector based on speed and angle
GameSystem.vector = function(velocityX, velocityY, angle) {
    this.direction = Math.atan2(velocityY, velocityX) * 180 / Math.PI;
    this.magnitude = Math.sqrt((Math.pow(velocityX, 2) + Math.pow(velocityY, 2)));
}

// Initialize the player
GameSystem.initializePlayer = function() {
    GameSystem.playerEntity = new GameSystem.entity({
        level: 1,
        faction: GameSystem.data.factions[3]
    }, GameSystem.data.items.rarities[3]);

    GameSystem.playerEntity.worldIndex = 0;

    GameSystem.playerSprite = GameSystem.game.add.sprite(GameSystem.game.world.width / 2, GameSystem.game.world.height - 100, GameSystem.playerEntity.ship.sprite);
    GameSystem.playerSprite.anchor.setTo(0.5, 0.5);
    GameSystem.game.physics.enable(GameSystem.playerSprite, Phaser.Physics.ARCADE);
    GameSystem.playerSprite.body.collideWorldBounds = true;
    
    var tintColor = "0x" + GameSystem.playerEntity.ship.tintColor;
    GameSystem.playerSprite.tint = tintColor;

    // Add animation to player's ship
    GameSystem.playerSprite.animations.add('fly', [0, 1], 20, true);
    GameSystem.playerSprite.play('fly');
}

// Make the enemies do stuff
GameSystem.updateAI = function(enemy) {
    
    // Set scout AI
    if (enemy.preset == "scout") {
        //enemy.entity.firePrimary(enemy);
        enemy.entity.move(enemy, "forward");
    }

    // Set fighter AI
    if (enemy.preset == "fighter") {
        enemy.entity.firePrimary(enemy);
        if (GameSystem.playerSprite.body.y - enemy.body.y < GameSystem.game.world.height / 2) {
            enemy.entity.move(enemy, "backward");
        } else {
            enemy.entity.move(enemy, "forward");
        }
        if (enemy.body.x > GameSystem.playerSprite.body.x) {
            enemy.entity.move(enemy, "right");
        } else {
            enemy.entity.move(enemy, "left");
        }
    }

    // Set kamikazi AI
    if (enemy.preset == "kamikazi") {
        enemy.entity.move(enemy, "forward");
        if (enemy.body.x > GameSystem.playerSprite.body.x) {
            enemy.entity.move(enemy, "right");
        } else {
            enemy.entity.move(enemy, "left");
        }
    }

    // Set kamikazi AI
    if (enemy.preset == "kamikazi") {
        enemy.entity.move(enemy, "forward");
        if (enemy.body.x > GameSystem.playerSprite.body.x) {
            enemy.entity.move(enemy, "right");
        } else {
            enemy.entity.move(enemy, "left");
        }
    }

    // Set bomber AI
    if (enemy.preset == "bomber") {
        enemy.entity.firePrimary(enemy);
        enemy.entity.move(enemy, "forward");
    }

    // Set miniBoss and boss AI
    if (enemy.preset == "miniBoss" && enemy.preset == "boss") {
        enemy.entity.firePrimary(enemy);
        if (enemy.body.x > GameSystem.playerSprite.body.x) {
            enemy.entity.move(enemy, "right");
        } else {
            enemy.entity.move(enemy, "left");
        }
    }
}


// Check if the enemy has flown past the player and out of the screen
GameSystem.checkBounds = function(sprite) {
    if (sprite.y > GameSystem.game.world.height) {
        sprite.destroy();
    }
}

// Update enemies
GameSystem.updateEnemies = function() {
    // For each enemy, update its AI
    GameSystem.enemies.forEachExists(GameSystem.updateAI, this, true);
    GameSystem.enemies.forEachExists(GameSystem.checkBounds, this);
}

// Create a projectile
GameSystem.projectile = function(weapon, ship) {
    // Play the sound of the weapon firing
    var fireSound = GameSystem.game.add.audio(weapon.fireSound, GameSystem.data.settings.sfxVolume);
    fireSound.play();

    // Create the projectile
    var projectile;
    if (ship === GameSystem.playerSprite) {
        projectile = GameSystem.playerProjectiles.create(ship.x, ship.y, weapon.sprite);
    } else {
        projectile = GameSystem.enemyProjectiles.create(ship.x, ship.y, weapon.sprite);
    }
    
    // Set the angle
    projectile.angle = ship.angle;
    
    // Set the onwer so we don't register collisions with the shooter
    projectile.owner = ship;
    
    // Set projectile color based on faction
    var tintColor = "0x" + weapon.tintColor;
    projectile.tint = tintColor;

    // Create the object and enable physics
    GameSystem.game.physics.enable(projectile, GameSystem.game.Physics);
    //projectile.physics = GameSystem.game.Physics;
    projectile.anchor.setTo(0.5, 0.5);
    projectile.outOfBoundsKill = true;
    projectile.checkWorldBounds = true;

    // Set projectile attributes and stats
    projectile.fireSound = weapon.fireSound;
    projectile.impactSound = weapon.impactSound;
    projectile.weapon = weapon.type;

    for (var i in weapon.stats) {
        projectile[i] = weapon.stats[i];
    }

    // Normalize values that are based on screen size or time
    var height = GameSystem.game.world.height;

    projectile["Shield Damage"] = weapon.stats["Shield Damage"];
    projectile["Armor Damage"] = weapon.stats["Armor Damage"];
    projectile["Maximum Speed"] = GameSystem.normalize(weapon.stats["Projectile Speed"], GameSystem.data.settings.projectileSpeedLowerBound, GameSystem.data.settings.projectileSpeedUpperBound, 1, GameSystem.data.settings.statUpperBound);
    projectile.acceleration = GameSystem.normalize(weapon.stats.Acceleration, GameSystem.data.settings.projectileAccelerationLowerBound, GameSystem.data.settings.projectileAccelerationUpperBound, 1, GameSystem.data.settings.statUpperBound);

    // Remove magic number!!!
    projectile.size = GameSystem.normalize(weapon.stats["Projectile Size"], 0, 100, 0, GameSystem.data.settings.statUpperBound) * 0.05;

    projectile["Blast Radius"] = GameSystem.normalize(weapon.stats["Blast Radius"], GameSystem.data.settings.blastRadiusLowerBound, GameSystem.data.settings.blastRadiusUpperBound, 1, GameSystem.data.settings.statUpperBound);
    
    // Set projectile size based on ship size and weapon stat
    projectile.scale.setTo(projectile.size, projectile.size);

    // Give the projectile a starting velocity (probably not useful unless acceleration system is changed)
    //projectile.body.velocity.y = -projectile.maxSpeed;
    return projectile;
}

// Create an explosion
GameSystem.explode = function(source) {
    var front = GameSystem.getFront(source);
    var explosion = GameSystem.explosions.create(front.x, front.y, "star-red");
    explosion.tint = source.tint;
    explosion.owner = source.owner || source;
    explosion["Shield Damage"] = source["Shield Damage"] || 0;
    explosion["Armor Damage"] = source["Armor Damage"] || 0;
    
    // Set explosion size based on projectile or ship
    if (source["Blast Radius"] != "undefined") {
        explosion.scale.setTo(source["Blast Radius"], source["Blast Radius"]);
    } else {
        explosion.scale.setTo(source.scale.x, source.scale.y);
    }
    
    // Enable physics
    GameSystem.game.physics.enable(explosion, GameSystem.game.Physics);
    explosion.outOfBoundsKill = true;
    explosion.checkWorldBounds = true;
    explosion.anchor.setTo(0.5, 0.5);

    // Set duration of explosion
    explosion.lifespan = 50;

    // Kill the projectile
    source.kill();
}

// Update projectile movement, check for collisions, etc.
GameSystem.updateProjectiles = function() {
    // First check if we've reached max distance or duration, that way we kill the projectile as soon as possible
    // Apparently Phaser sprites have a timer we can use to kill projectiles and stuff
    GameSystem.playerProjectiles.forEachExists(GameSystem.checkProjectileDuration, this);
    GameSystem.playerProjectiles.forEachExists(GameSystem.checkProjectileDistance, this);
    GameSystem.enemyProjectiles.forEachExists(GameSystem.checkProjectileDuration, this);
    GameSystem.enemyProjectiles.forEachExists(GameSystem.checkProjectileDistance, this);

    // Update projectile movement, animations, etc.
    GameSystem.playerProjectiles.forEachExists(GameSystem.checkProjectileSpeed, this);
    GameSystem.enemyProjectiles.forEachExists(GameSystem.checkProjectileSpeed, this);
}

GameSystem.checkProjectileSpeed = function(projectile) {
    // Get current projectile speed
    var speed = Math.abs(Math.pow(projectile.body.velocity.x, 2) + Math.pow(projectile.body.velocity.y, 2));

    // Check if the projectile has reached maximum speed
    if (speed < projectile["Maximum Speed"]) {
        // If it hasn't reached maximum speed, then get the x and y acceleration
        var xAcceleration = Math.cos(projectile.rotation) * projectile["Acceleration"];
        var yAcceleration = Math.sin(projectile.rotation) * projectile["Acceleration"];

        var newSpeed = Math.abs(Math.pow(projectile.body.velocity.x + xAcceleration, 2) + Math.pow(projectile.body.velocity.y + yAcceleration, 2));

        // If we accelerate past maximum speed
        if (newSpeed > projectile["Maximum Speed"]) {
            // Set speed to maximum
            projectile.body.velocity.x = Math.cos(projectile.rotation - (90 * Math.PI / 180)) * projectile["Maximum Speed"];
            projectile.body.velocity.y = Math.sin(projectile.rotation - (90 * Math.PI / 180)) * projectile["Maximum Speed"];
        } else {
            projectile.body.velocity.x = Math.cos(projectile.rotation - (90 * Math.PI / 180)) * newSpeed;
            projectile.body.velocity.y = Math.sin(projectile.rotation - (90 * Math.PI / 180)) * newSpeed;
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
        var delay = GameSystem.normalize(GameSystem.data.settings.statUpperBound - weapon.stats["Rate of Fire"], 35, 750, 1, GameSystem.data.settings.statUpperBound);
        weapon.time = GameSystem.game.time.now + delay;
        return true;
    }
    // Otherwise don't fire
    return false;
}

// Handle projectile collisions with enemies
GameSystem.enemyCollisionHandler = function(projectile, target) {
    // Check if we're colliding with the shooter
    if (projectile.owner == target) {
        //console.log("Projectile hit owner");
    } else {
        //console.log("Projectile hit target");
        GameSystem.explode(projectile);
        target.destroy();
        //GameSystem.game.add.tween(target).to( { alpha: 0 }, 100, Phaser.Easing.Linear.None, true);
    }
}

// Handle projectile collision with player
GameSystem.playerCollisionHandler = function(player, projectile) {
    // Check if we're colliding with the shooter
    if (projectile.owner == player) {
        //console.log("Projectile hit owner");
    } else {
        GameSystem.explode(projectile);
    }
}

// Get the front and center point of the sprite
GameSystem.getFront = function(sprite) {
    var x = sprite.x + Math.cos(sprite.rotation - (90 * Math.PI / 180)) * sprite.width / 2;
    var y = sprite.y + Math.sin(sprite.rotation - (90 * Math.PI / 180)) * sprite.height / 2;
    var front = new Phaser.Point(x, y);
    return front;
}

// Create a vendor
GameSystem.vendor = function(world, itemType) {
    var vendor = {};
    vendor.faction = world.faction;
    vendor.level = world.level;
    vendor.type = itemType;

    // Choose a name at random
    var random = GameSystem.game.rnd.integerInRange(0, vendor.faction.firstNames.length - 1);
    var firstName = vendor.faction.firstNames[random];
    random = GameSystem.game.rnd.integerInRange(0, vendor.faction.lastNames.length - 1);
    var lastName = vendor.faction.lastNames[random];

    vendor.name = firstName + " " + lastName;

    vendor.items = [];
    for (var i = 0; i < 5; i++) {
        vendor.items.push(new GameSystem.item(vendor, vendor.type));
    }
    return vendor;
}

// Create an item
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
    var faction;
    if (typeof source.faction == "undefined") {
        var random = GameSystem.game.rnd.integerInRange(0, GameSystem.data.factions.length - 1);
        for (var i in GameSystem.data.factions) {
            if (random == i) {
                faction = GameSystem.data.factions[i];
            }
        }
    } else {
        // Otherwise load faction
        faction = source.faction;
    }

    // If unspecified, get a random rarity
    if (typeof rarity == "undefined") {
        var random = GameSystem.game.rnd.integerInRange(0, 100);
        for (var i in GameSystem.data.items.rarities) {
            if (random <= GameSystem.data.items.rarities[i].dropChance) {
                //console.log("Success! We rolled a " + random + " and we were looking for a " + GameSystem.data.items.rarities[i].dropChance + ", which means our item is " + GameSystem.data.items.rarities[i].name);
                rarity = GameSystem.data.items.rarities[i];
                break;
            }
        }
    } else {
        // Otherwise load rarity
        for (var i in GameSystem.data.items.rarities) {
            if (rarity == GameSystem.data.items.rarities[i]) {
                rarity = GameSystem.data.items.rarities[i];
            }
        }
    }

    // If we roll a bonus, choose a stat to boost
    rarity.statBonuses = [];
    var random = GameSystem.game.rnd.integerInRange(0, 100);    
    if (random < rarity.bonusChance) {
        var random = GameSystem.game.rnd.integerInRange(0, itemTemplate.bonusNames.length - 1);
        for (var i in itemTemplate.bonusNames) {
            if (random == i) {
                rarity.statBonuses.push(GameSystem.game.rnd.integerInRange(rarity.minStatBoost, rarity.maxStatBoost));
                rarity.bonusName = itemTemplate.bonusNames[i];
            } else {
                rarity.statBonuses.push(0);
            }
        }
    } else {
        // Otherwise set all stats to 0
        for (var i in itemTemplate.bonusNames) {
            rarity.statBonuses.push(0);
        }
    }

    // Set item tint color
    item.tintColor = faction.color;

    // Add faction bonus
    faction.statBonuses = [];
    for (var i in faction.bonuses) {
        if (itemType == i) {
            var counter = 0;
            for (var j in faction.bonuses[i]) {
                faction.statBonuses[counter] = faction.bonuses[i][j];
                counter++;
            }
        }
    }

    // Check if we have a special (add later)

    // Set item name
    var name = item.name;
    if (typeof rarity.bonusName == "undefined") {
        item.name = rarity.name + " " + item.name + " of " + faction.name;
    } else {
        item.name = rarity.name + " " + rarity.bonusName + " " + item.name + " of " + faction.name;
    }

    // Update item stats based on source level, rarity, bonus
    var statValue = 0;
    var counter = 0;
    for (var i in item.stats) {
        var statMultiplier = (GameSystem.game.rnd.integerInRange(rarity.minStatMultiplier, rarity.maxStatMultiplier) + 100) / 100;
        var oldStat = item.stats[i];
        item.stats[i] = Math.floor(item.stats[i] * statMultiplier + faction.statBonuses[counter] + rarity.statBonuses[counter] + item.level * GameSystem.data.items.levelMultiplier);
        statValue += item.stats[i] - oldStat;
        counter++;
    }

    // Update item value
    item.value = Math.floor(GameSystem.data.items.minValue + (item.level * GameSystem.data.items.minValue / 100) + (statValue * GameSystem.data.items.minValue / 100));

    return item;
}

// Define class for creating menu structure
GameSystem.node = function(name, pointer, type) {
    this.name = name || "node"; // The name to be displayed
    this.pointer = pointer || {}; // The object linked to the node
    this.type = type || "leaf"; // The type of node (for executing node command)    
    this.selected = false;
    this.parent = {};
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
GameSystem.node.prototype.addChild = function(name, pointer, type) {
    var child = new GameSystem.node(name, pointer, type);
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
    return (typeof this.parent !== "undefined") ? this.parent.children : this;
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

// Select the grandparent (used for creating menu nodes that leave the current menu)
GameSystem.node.prototype.selectGrandparent = function() {
    if (this.parent.parent.type == "root") {
        parent = this.parent.parent;
    } else {
        parent = this.parent.selectParent();
    }
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
		child = this.execute();
        if (typeof child == "undefined") {
            child = this;
        } else {
            child = child.getSelected();
        }
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
	GameSystem.clearMenu();

	var siblings = this.getSiblings();

    // Add the current menu name
	GameSystem.game.text.push(GameSystem.game.add.text(GameSystem.data.menu.fonts.menuTitle.xPosition, GameSystem.data.menu.fonts.menuTitle.yPosition, this.parent.name, GameSystem.data.menu.fonts.menuTitle));

    // Add menu children names
	for (var i in siblings) {
		var font = (siblings[i].selected) ? GameSystem.data.menu.fonts.selected : GameSystem.data.menu.fonts.unselected;
		GameSystem.game.text.push(GameSystem.game.add.text(font.xPosition, i * font.ySpacing + font.yPosition, siblings[i].name, font));
	}

    // Display information about selected node
    switch (this.type) {
        case "vendor": 
            var font = GameSystem.data.menu.fonts.help;
            //font.fill = "#" + this.pointer.tintColor;
            font.fill = "#" + this.pointer.faction.color;
            GameSystem.game.text.push(GameSystem.game.add.text(GameSystem.data.menu.fonts.help.xPosition, GameSystem.data.menu.fonts.help.yPosition, this.pointer.type.toUpperCase() + " VENDOR", font));
            break;
        case "item":
        case "ship":
        case "weapon":
        case "shield":
        case "engine":
        case "generator":
        case "module":
            var font = GameSystem.data.menu.fonts.help;
            font.fill = "#" + this.pointer.tintColor;
            var counter = 0;
            GameSystem.game.text.push(GameSystem.game.add.text(GameSystem.data.menu.fonts.help.xPosition, counter * GameSystem.data.menu.fonts.help.ySpacing + GameSystem.data.menu.fonts.help.yPosition, "COST: " + this.pointer.value, font));
            counter++;
            var text = "";
            for (var i in this.pointer.stats) {
                GameSystem.game.text.push(GameSystem.game.add.text(GameSystem.data.menu.fonts.help.xPosition, counter * GameSystem.data.menu.fonts.help.ySpacing + GameSystem.data.menu.fonts.help.yPosition, i.toUpperCase() + " " + this.pointer.stats[i], font));
                counter++;
            }
            break;
        case "mission":
            var font = GameSystem.data.menu.fonts.help;
            font.fill = "#" + this.pointer.faction.color;
            GameSystem.game.text.push(GameSystem.game.add.text(GameSystem.data.menu.fonts.help.xPosition, GameSystem.data.menu.fonts.help.yPosition, "LAUNCH MISSION", font));
            break;
        case "faction":
            var font = GameSystem.data.menu.fonts.help;
            font.fill = "#" + this.pointer.color;
            GameSystem.game.text.push(GameSystem.game.add.text(GameSystem.data.menu.fonts.help.xPosition, GameSystem.data.menu.fonts.help.yPosition, this.pointer.description, font));
            break;
    }
}

// Execute node command
GameSystem.node.prototype.execute = function() {
	// First see if we are doing something with an object referenced by the node 
    switch (this.type) {
        case "mission":
            GameSystem.game.state.start("play", true, false, this.pointer);
            break;
        // We're selecting an item
        case "item":
            if (GameSystem.playerEntity.money < this.pointer.value) {
                console.log("Item is too expensive");
            } else {
                return GameSystem.viewShip(this, "buy", this.pointer);
            }
            break;
        // We're selecting a weapon from the ship menu
        case "weapon":
            //console.log(this.pointer);
            break;
        // Otherwise execute special instructions
        default:
            switch (this.name) {
            case "NEW GAME": // Start new game
                GameSystem.storage.reset();
                GameSystem.game.state.start("dock", true, false, 0);
                break;
            case "CONTINUE": // Continue game
                GameSystem.storage.load();
                GameSystem.game.state.start("dock", true, false, GameSystem.playerEntity.worldIndex);
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
            case "DONE": // Leave current menu
                return this.selectGrandparent();
                break;
        }
    }
}

// Show player's ship
GameSystem.viewShip = function(parent, action, item) {
    if (typeof action != "undefined" && typeof item == "undefined") {
        console.log("Error: can't buy or sell undefined item.");
    } else {
        // Show the player's ship
        var shipSprite = GameSystem.game.add.sprite(300, 400, "ship-4");
        shipSprite.scale.setTo(3, 3);

        var primaryWeaponMenu = parent.addChild("PRIMARY WEAPONS")
            for (var i = 0; i < GameSystem.playerEntity.ship.primaryWeaponSlots; i++) {
                if (typeof GameSystem.playerEntity.primaryWeapons[i] !== "undefined") {
                    primaryWeaponMenu.addChild(GameSystem.playerEntity.primaryWeapons[i].name.toUpperCase(), GameSystem.playerEntity.primaryWeapons[i], "weapon");
                } else {
                    primaryWeaponMenu.addChild("EMPTY SLOT", {}, "weapon");
                }
            }
            primaryWeaponMenu.addChild("DONE");
        
        var secondaryWeaponMenu = parent.addChild("SECONDARY WEAPONS")
            for (var i = 0; i < GameSystem.playerEntity.ship.secondaryWeaponSlots; i++) {
                if (typeof GameSystem.playerEntity.secondaryWeapons[i] !== "undefined") {
                    secondaryWeaponMenu.addChild(GameSystem.playerEntity.secondaryWeapons[i].name.toUpperCase(), GameSystem.playerEntity.secondaryWeapons[i], "weapon");
                } else {
                    secondaryWeaponMenu.addChild("EMPTY SLOT", {}, "weapon");
                }
            }
            secondaryWeaponMenu.addChild("DONE");

        var shieldMenu = parent.addChild("SHIELD")
            if (typeof GameSystem.playerEntity.shield !== "undefined") {
                shieldMenu.addChild(GameSystem.playerEntity.shield.name.toUpperCase(), GameSystem.playerEntity.shield, "shield");
            } else {
                shieldMenu.addChild("EMPTY SLOT", {}, "shield");
            }
            shieldMenu.addChild("DONE");

        var engineMenu = parent.addChild("ENGINE")
            if (typeof GameSystem.playerEntity.engine !== "undefined") {
                engineMenu.addChild(GameSystem.playerEntity.engine.name.toUpperCase(), GameSystem.playerEntity.engine, "engine");
            } else {
                engineMenu.addChild("EMPTY SLOT", {}, "engine");
            }
            engineMenu.addChild("DONE");

        var generatorMenu = parent.addChild("GENERATOR")
            if (typeof GameSystem.playerEntity.generator !== "undefined") {
                generatorMenu.addChild(GameSystem.playerEntity.generator.name.toUpperCase(), GameSystem.playerEntity.generator, "generator");
            } else {
                generatorMenu.addChild("EMPTY SLOT", {}, "generator");
            }
            generatorMenu.addChild("DONE");

        var moduleMenu = parent.addChild("MODULES")
            for (var i = 0; i < GameSystem.playerEntity.ship.moduleSlots; i++) {
                if (typeof GameSystem.playerEntity.modules[i] !== "undefined") {
                    moduleMenu.addChild(GameSystem.playerEntity.modules[i].name.toUpperCase(), GameSystem.playerEntity.modules[i], "module");
                } else {
                    moduleMenu.addChild("EMPTY SLOT", {}, "module");
                }
            }
            moduleMenu.addChild("DONE");

        parent.addChild("DONE");
    }
    return parent;
}

// Remove menu text and sprites
GameSystem.clearMenu = function() {
    for (var i in GameSystem.game.text) {
        GameSystem.game.text[i].destroy();
    }
}

// Normalize values into useful bounds
GameSystem.normalize = function(value, lowerBound, upperBound, minValue, maxValue) {
    // If we aren't given values, normalize between 0 and 100
    minValue = (minValue) ? minValue : 0;
    maxValue = (maxValue) ? maxValue : 100;
    return lowerBound + ((value - minValue) * (upperBound - lowerBound) / (maxValue - minValue));
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
            GameSystem.playerEntity = gameData;
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
        var gameData = GameSystem.playerEntity;

        // Put data into web storage
        localStorage.setItem(GameSystem.data.settings.webStorageName, JSON.stringify(gameData));
    } else {
        console.log("Web storage not supported. Unable to load game data.");
    }
}

// Reset data in memory
GameSystem.storage.reset = function() {
    console.log("Resetting game data in memory.");
    //GameSystem.player = {};
    GameSystem.playerEntity = {};
    GameSystem.playerEntity.worldIndex = 0;
    GameSystem.playerEntity.ship = {};
    GameSystem.playerEntity.primaryWeapons = [];
    GameSystem.playerEntity.secondaryWeapons = [];
    GameSystem.playerEntity.shield = {};
    GameSystem.playerEntity.generator = {};
    GameSystem.playerEntity.engine = {};
    GameSystem.playerEntity.modules = [];
    GameSystem.playerEntity.money = GameSystem.data.settings.startingMoney;

    GameSystem.playerEntity = new GameSystem.entity({
        level: 1,
        faction: GameSystem.data.factions[3]
    }, GameSystem.data.items.rarities[3]);
}

// Reset data in web storage
// Probably don't need this function because the only time you 'erase' web storage is by overriding it with a new game (saving)
GameSystem.storage.erase = function() {
    console.log("Erasing web storage.");
    if (typeof Storage !== "undefined") { // Verify web storage support
        localStorage.removeItem(GameSystem.data.settings.webStorageName); // Delete data in web storage
        GameSystem.storage.reset();
        GameSystem.storage.save();
    } else {
        console.log("Web storage not supported. No need to erase data.");
    }
}

// Copy an object
GameSystem.clone = function (original, context, key) {
    for (key in context)
        if (context.hasOwnProperty(key))
            if (Object.prototype.toString.call(context[key]) === '[object Object]')
                original[key] = GameSystem.clone(original[key] || {}, context[key]);
            else
                original[key] = context[key];
    return original;
};

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