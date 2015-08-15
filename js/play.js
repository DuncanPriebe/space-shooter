// Game state and functions
var playState = {
    missionTime: 0,
    mission: {},

    // Accept parameters from menu selection and store them in play state
    init: function(_mission) {
        mission = _mission;
    }, 

    create: function() {
        game.time.desiredFps = 60;

        // Load and setup mission
        game.stage.backgroundColor = mission.backgroundColor; // Set background color
        missionTime = game.time.now + mission.timer; // Reset mission timer

        // Setup player's ship
        player = game.add.sprite(game.world.width / 2, game.world.height - 100, 'ship');
        player.anchor.setTo(0.5, 0.5);
        game.physics.enable(player, Phaser.Physics.ARCADE);
        player.body.collideWorldBounds = true;
        player.animations.add('fly', [ 0, 1], 20, true);
        player.play('fly');

        // Setup projectiles
        projectiles = game.add.group();
        projectiles.enableBody = true;
        projectiles.physicsBodyType = Phaser.Physics.ARCADE;
        projectiles.createMultiple(30, 'projectile');
        projectiles.setAll('anchor.x', 0.5);
        projectiles.setAll('anchor.y', 1);
        projectiles.setAll('outOfBoundsKill', true);
        projectiles.setAll('checkWorldBounds', true);

        // Setup stars
        stars = game.add.group();
        stars.enableBody = true;
        
        cursors = game.input.keyboard.createCursorKeys();
        fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        //sfx = game.add.audio('sfx');
        sfxLaser = game.add.audio('sfx-laser');
        sfxLaser.volume = game.settings.sfxVolume;
        sfxExplosion = game.add.audio('sfx-explosion');
        sfxExplosion.volume = game.settings.sfxVolume;
        music = game.add.audio('music');
        music.volume = game.settings.musicVolume;
        music.loop = true;
        music.play();
        muteFlag = false;        

        muteButton = game.add.button(795, 595, 'button', this.muteToggle, this);
        muteButton.anchor.set(1);
        muteButtonText = game.add.text(muteButton.x - muteButton.width / 2, muteButton.y - muteButton.height / 2 + 4, 'Mute', {font: '14px Consolas', fill: '#000000'});        
        muteButtonText.anchor.set(0.5);
    },

    muteToggle: function(button) {
        if (muteFlag) {
            muteFlag = false;
            music.resume();
            muteButtonText.text = 'Mute';
        } else {
            muteFlag = true;
            music.pause();
            muteButtonText.text = 'Unmute';
        }        
    },

    update: function() {
        // Check if the mission time has expired
        if (game.time.now > missionTime) {
            music.stop();
            game.state.start('win');
        }

        // Stop the player's movement
        player.body.velocity.x = 0;

        if (cursors.left.isDown) {
            player.body.velocity.x = -250;
        } else if (cursors.right.isDown) {
            player.body.velocity.x = 250;
        }
        
        if (fireButton.isDown) {
            this.fireprojectile();
        }

        this.makeStars();
    },

    render: function() {
        game.debug.text(game.time.suggestedFps, 32, 32); // Display debug text
    },

    makeStars: function() {
        if (game.time.now > starTime) {
            var starX = game.rnd.integerInRange(0, game.world.width - 30);
            var random = game.rnd.integerInRange(0, 150);

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

            player.bringToTop();        
            game.world.bringToTop(projectiles);         

            starTime = game.time.now + game.rnd.integerInRange(starMinDelay, starMaxDelay);
        }
    },

    fireprojectile: function() {
        //  To avoid them being allowed to fire too fast we set a time limit
        if (game.time.now > projectileTimer)
        {
            //  Grab the first projectile we can from the pool
            projectile = projectiles.getFirstExists(false);

            if (projectile)
            {
                //  And fire it
                projectile.reset(player.x, player.y - 25);
                projectile.body.velocity.y = -projectileSpeed;
                projectileTimer = game.time.now + 100;
                if (!muteFlag) {
                    sfxLaser.play();                    
                }                
            }
        }
    },

    collisionHandler: function(projectile, target) {
        projectile.kill();
        game.add.tween(target).to( { alpha: 0 }, 100, Phaser.Easing.Linear.None, true);
        target.kill();
        if (!muteFlag) {
            sfxExplosion.play();
        }
        //this.win();
    },

    win: function() {
        music.stop();
        game.state.start('win');
    }
};