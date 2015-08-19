var bootState = {
    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.forceSingleUpdate = true; // Reduces lag for some reason

        game.time.desiredFps = 60;

        game.state.start('load');
    }
};