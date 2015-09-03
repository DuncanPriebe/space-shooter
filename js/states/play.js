// GameObject state and functions
var playState = {

    // Accept parameters from menu selection and store them in play state
    init: function(mission) {
        if (typeof mission == "undefined" || mission == null) {
            console.log("Mission data is corrupt or doesn't exist.");
            GameSystem.game.state.start("dock", true, false, GameSystem.playerEntity.worldIndex);
        } else {
            GameSystem.game.mission = mission;
        }
    },

    preload: function() {
        // Load state assets
        GameSystem.loadStateAssets(this.key);

        // Create pool of projectiles, enemies, etc.
        GameSystem.initialize("bounds");
        GameSystem.initialize("groups");
    },

    create: function() {
        //player = zyrian; // Gotta figure out how to organize game/player data...

        // Load and setup mission
        GameSystem.game.stage.backgroundColor = GameSystem.game.mission.backgroundColor; // Set background color
        //missionTime = GameObject.time.now + mission.timer; // Reset mission Create

        // timer enemies for testing
        //var enemy = GameSystem.enemy(GameSystem.game.mission, "normal");
        var miniBoss = GameSystem.enemy(GameSystem.game.mission, "miniBoss");

        GameSystem.initializePlayer();

        // Add controls
        cursors = GameSystem.game.input.keyboard.createCursorKeys();
        firePrimaryButton = GameSystem.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        fireSecondaryButton = GameSystem.game.input.keyboard.addKey(Phaser.Keyboard.CONTROL);
        escapeButton = GameSystem.game.input.keyboard.addKey(Phaser.Keyboard.ESC);

        muteKey = GameSystem.game.input.keyboard.addKey(Phaser.Keyboard.M);
        muteKey.onDown.add(this.muteToggle, this);


        /*
        // Setup stars
        stars = GameObject.add.group();
        stars.enableBody = true;

        // Use emitter to create stars
        var emitter = GameObject.add.emitter(GameObject.world.centerX, 0, 300);
        emitter.width = GameObject.world.width;
        emitter.makeParticles(['star-blue', 'star-red']);
        emitter.minParticleScale = 0.2;
        emitter.maxParticleScale = 0.4;
        emitter.setYSpeed(25, 50);
        emitter.gravity = 0;
        emitter.setXSpeed(0, 0);
        emitter.minRotation = 0;
        emitter.maxRotation = 0;
        emitter.start(false, 24000, 100, 0);

        //sfx = GameObject.add.audio('sfx');
        sfxLaser = GameObject.add.audio('sfx-laser');
        sfxLaser.volume = GameObject.settings.sfxVolume;
        sfxExplosion = GameObject.add.audio('sfx-explosion');
        sfxExplosion.volume = GameObject.settings.sfxVolume;
        music = GameObject.add.audio('music');
        music.volume = GameObject.settings.musicVolume;
        music.loop = true;
        music.play();
        GameObject.mute = false;

        muteButton = GameObject.add.button(795, 595, "label-blue", this.muteToggle, this);
        muteButton.anchor.set(1);
        muteButtonText = GameObject.add.text(muteButton.x - muteButton.width / 2, muteButton.y - muteButton.height / 2 + 4, 'Mute', {font: '14px Consolas', fill: '#000000'});        
        muteButtonText.anchor.set(0.5);
        */
    },

    muteToggle: function(button) {
        if (GameObject.mute) {
            GameObject.mute = false;
            music.resume();
            muteButtonText.text = 'Mute';
        } else {
            GameObject.mute = true;
            music.pause();
            muteButtonText.text = 'Unmute';
        }        
    },

    update: function() {
        /*
        // Check if the mission time has expired
        if (GameObject.time.now > missionTime) {
            music.stop();
            GameObject.state.start('win');
        }
        */

        // Stop the player.sprite's movement
        GameSystem.playerSprite.body.velocity.x = 0;

        if (cursors.left.isDown) {
            GameSystem.playerSprite.body.velocity.x = -250;
        } else if (cursors.right.isDown) {
            GameSystem.playerSprite.body.velocity.x = 250;
        }
        
        if (firePrimaryButton.isDown && !fireSecondaryButton.isDown) {
            GameSystem.playerEntity.firePrimary(GameSystem.playerSprite);
            //GameSystem.firePrimary(GameSystem.player);
        }

        if (fireSecondaryButton.isDown && !firePrimaryButton.isDown) {
            GameSystem.playerEntity.fireSecondary(GameSystem.playerSprite);
            //GameSystem.fireSecondary(GameSystem.player);
        }

        if (escapeButton.isDown) {
            GameSystem.game.state.start('dock', true, false, GameSystem.playerEntity.worldIndex);
        }

        GameSystem.updateEnemies();

        // Make sure player and projectiles are above background sprites
        GameSystem.playerSprite.bringToTop();

        GameSystem.updateProjectiles();

        GameSystem.game.physics.arcade.overlap(GameSystem.projectiles, GameSystem.enemies, GameSystem.enemyCollisionHandler, null, this);
        GameSystem.game.physics.arcade.overlap(GameSystem.projectiles, GameSystem.playerSprite, GameSystem.playerCollisionHandler, null, this);

        // If we want collisions with physics, use this:
        //GameSystem.game.physics.arcade.collide(GameSystem.projectiles, GameSystem.playerSprite, GameSystem.collisionHandler, null, this);

        //this.makeStars();
    },

    render: function() {
        GameSystem.game.debug.text("FPS: " + GameSystem.game.time.suggestedFps, 5, 15); // Display debug text

        GameSystem.game.debug.text("MONEY: " + GameSystem.monify((GameSystem.playerEntity.money)), 5, 590); // Display debug text
    },

    makeStars: function() {
        if (GameObject.time.now > starTime) {
            var starX = GameObject.rnd.integerInRange(0, GameObject.world.width - 30);
            var random = GameObject.rnd.integerInRange(0, 150);

            if (random < 6) { // We have a galaxy
                if (random < 2) {
                    var star = stars.create(starX, -100, 'galaxy-pink');
                } else if (random < 4) {
                    var star = stars.create(starX, -100, 'galaxy-blue');
                } else {
                    var star = stars.create(starX, -100, 'galaxy-green');
                }

                if (random % 2 == 0) {
                    star.scale.set(0.75);
                    star.body.velocity.y = starSpeed * 0.4; // Regular galaxy
                } else {
                    star.scale.set(0.45);
                    star.body.velocity.y = starSpeed * 0.3; // Small galaxy
                }
            } else if (random < 12) { // We have a planet
                if (random < 8) {
                    var star = stars.create(starX, -100, 'planet-red');
                } else if (random < 10) {
                    var star = stars.create(starX, -100, 'planet-blue');
                } else {
                    var star = stars.create(starX, -100, 'planet-yellow');
                }

                if (random % 2 == 0) {
                    star.body.velocity.y = starSpeed * 1.2; // Regular planet
                } else {
                    star.scale.set(1.5);
                    star.body.velocity.y = starSpeed * 1.5; // Big planet
                }
            } else { // We have a star
                if (random < 81) {
                    var star = stars.create(starX, -100, 'star-red');
                } else {
                    var star = stars.create(starX, -100, 'star-blue');
                }

                if (random % 3 == 0) {
                    star.scale.set(0.75);
                    star.body.velocity.y = starSpeed * 0.7; // Regular star
                } else {
                    star.scale.set(0.25);
                    star.body.velocity.y = starSpeed * 0.5; // Small star
                }
            }

            starTime = GameObject.time.now + GameObject.rnd.integerInRange(starMinDelay, starMaxDelay);
        }
    },
    win: function() {
        music.stop();
        GameObject.state.start('win');
    }
};