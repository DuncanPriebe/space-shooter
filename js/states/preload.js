'use strict';
var preloadState = {
    preload: function() {
        // Display a message while the game loads
        var loadingLabel = GameSystem.game.add.text(80, 150, 'LOADING GAME DATA...', {font: '30px Courier', fill: '#ffffff'});

        // Load game data from JSON files (set overwrite to true for testing purposes)
        GameSystem.game.load.json('settings', 'lib/settings.json', true);
        GameSystem.game.load.json('assets', 'lib/assets.json', true);
        GameSystem.game.load.json('menu', 'lib/menu.json', true);
        GameSystem.game.load.json('factions', 'lib/factions.json', true);
        GameSystem.game.load.json('docks', 'lib/docks.json', true);
        GameSystem.game.load.json('worlds', 'lib/worlds.json', true);
        GameSystem.game.load.json('missions', 'lib/missions.json', true);
        GameSystem.game.load.json('items', 'lib/items.json', true);
    },

    create: function() {
        //GameSystem.game.cache.destroy(); // Remove existing assets from cache (may be needed for testing)
        GameSystem.data = {};
        
        // Store JSON data in memory
        GameSystem.data.settings = GameSystem.game.cache.getJSON('settings');
        GameSystem.data.assets = GameSystem.game.cache.getJSON('assets');
        GameSystem.data.menu = GameSystem.game.cache.getJSON('menu');
        GameSystem.data.factions = GameSystem.game.cache.getJSON('factions');
        GameSystem.data.docks = GameSystem.game.cache.getJSON('docks');
        GameSystem.data.worlds = GameSystem.game.cache.getJSON('worlds');
        GameSystem.data.missions = GameSystem.game.cache.getJSON('missions');
        GameSystem.data.items = GameSystem.game.cache.getJSON('items');

        GameSystem.game.state.start('menu');
    }
};