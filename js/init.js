'use strict';

/*-----------------------------------------------------------------------
                    Preloading and Initialization
-----------------------------------------------------------------------*/

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
            //if (!GameSystem.initializedGroups) {
                GameSystem.playerProjectiles = GameSystem.game.add.group();
                GameSystem.enemyProjectiles = GameSystem.game.add.group();
                GameSystem.enemies = GameSystem.game.add.group();
                GameSystem.explosions = GameSystem.game.add.group();

                GameSystem.playerProjectiles.z = 3;
                GameSystem.enemyProjectiles.z = 3;
                GameSystem.enemies.z = 5;
                GameSystem.explosions.z = 4;


                //GameSystem.initializedGroups = true;
            //}
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

/*-----------------------------------------------------------------------
                     Add States & Start Game
-----------------------------------------------------------------------*/

GameSystem.game.state.add('boot', bootState);
GameSystem.game.state.add('preload', preloadState);
GameSystem.game.state.add('menu', menuState);
GameSystem.game.state.add('dock', dockState);
GameSystem.game.state.add('play', playState);
GameSystem.game.state.add('win', winState);

GameSystem.game.state.start('boot');