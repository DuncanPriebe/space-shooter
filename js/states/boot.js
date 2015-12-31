'use strict';

var bootState = {
    create: function() {
        GameSystem.game.physics.startSystem(Phaser.Physics.ARCADE); // Start physics engine (move to play state?)

        GameSystem.game.forceSingleUpdate = true; // Reduces lag for some reason

        GameSystem.game.time.desiredFps = 60; // Set framerate

        GameSystem.game.state.start('preload');
    }
};