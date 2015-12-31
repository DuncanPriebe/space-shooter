'use strict';

/*-----------------------------------------------------------------------
                                Enemies
-----------------------------------------------------------------------*/

// Use polymorphism for different enemy types
GameSystem.newEnemy = function() {
    
}

GameSystem.newEnemy.prototype = {
    AI: function() {
        console.log("Enemy AI");
    }
}

GameSystem.newScout = function() {
    GameSystem.newEnemy.call(this);
}

GameSystem.newScout.prototype = Object.create(GameSystem.newEnemy.prototype);
GameSystem.newScout.prototype.constructor = GameSystem.newScout;

GameSystem.newScout.prototype = {
    AI: function() {
        console.log("Scout AI.");
    }
}

// Create enemies based on mission
GameSystem.enemyFactory = function(mission) {
    // Set spawn y location
    var spawnY = -40;

    // Check if the mission is over
    /*
    if (mission.checkEnemyCount) {  // Check if we're out of enemies
        if (mission.enemiesSpawned > mission.enemiesRemaning) {
            console.log("Mission is out of enemies.");
        }
    }
    */

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

    /*
    if (mission.checkDuration) { // Check if time has run out
        if (GameSystem.game.time.now > mission.time) {
            console.log("Mission timer has expired.");
        }
    }
    */

    // Create an enemy, cluster, or boss
    // Now check if we're in the middle of spawning a cluster
    if (mission.clusterFlag) {
        if (GameSystem.game.time.now > mission.clusterTime) {
            // Need to somehow load the same enemy for the entire cluster...

            // Choose a spawn location
            if (mission.clusterSpawnX == -1) {
                mission.clusterSpawnX = GameSystem.game.rnd.integerInRange(0, GameSystem.game.world.width);    
            }
            
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

// Make the enemies do stuff
GameSystem.updateAI = function(enemy) {
    // Set scout AI
    if (enemy.preset == "scout") {
        enemy.entity.move(enemy, "forward");
        if (enemy.body.x > GameSystem.playerSprite.body.x) {
            enemy.entity.move(enemy, "right");
        } else if (enemy.body.x < GameSystem.playerSprite.body.x) {
            enemy.entity.move(enemy, "left");
        }
    }

    // Set fighter AI
    if (enemy.preset == "fighter") {
        if (enemy.body.y > 0 && enemy.body.y < GameSystem.playerSprite.body.y) {
            enemy.entity.firePrimary(enemy);
        }
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

    // Set kamikaze AI
    if (enemy.preset == "kamikaze") {
        enemy.entity.move(enemy, "forward");
        if (enemy.body.x > GameSystem.playerSprite.body.x) {
            enemy.entity.move(enemy, "right");
        } else {
            enemy.entity.move(enemy, "left");
        }
    }

    // Set bomber AI
    if (enemy.preset == "bomber") {
        if (enemy.body.y > 0) {
            enemy.entity.firePrimary(enemy);
        }
        enemy.entity.move(enemy, "forward");
    }

    // Set freighter AI
    if (enemy.preset == "freighter") {
        enemy.entity.move(enemy, "forward");
    }    

    // Set miniBoss and boss AI
    if (enemy.preset == "miniBoss" || enemy.preset == "boss") {
        if (enemy.body.y > 0 && enemy.body.y < GameSystem.playerSprite.body.y) {
            enemy.entity.firePrimary(enemy);
            enemy.entity.fireSecondary(enemy);
        }
        if (enemy.body.y < 50) {
            enemy.entity.move(enemy, "forward");
        } else {
            enemy.entity.move(enemy, "backward");
        }
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