'use strict';
var preloadState = {
    preload: function() {
        // Display a message while the game loads
        var loadingLabel = GameSystem.game.add.text(80, 150, 'LOADING GAME DATA...', {font: '30px Courier', fill: '#ffffff'});

        // Load game data from JSON files (set overwrite to true for testing purposes)
        GameSystem.game.load.json('settings', 'lib/settings.json', true);
        GameSystem.game.load.json('assets', 'lib/assets.json', true);
        GameSystem.game.load.json('menu', 'lib/menu.json', true);
        GameSystem.game.load.json('docks', 'lib/docks.json', true);
        GameSystem.game.load.json('missions', 'lib/missions.json', true);
        GameSystem.game.load.json('ships', 'lib/ships.json', true);
        GameSystem.game.load.json('weapons', 'lib/weapons.json', true);
        GameSystem.game.load.json('shields', 'lib/shields.json', true);
        GameSystem.game.load.json('generators', 'lib/generators.json', true);
        GameSystem.game.load.json('engines', 'lib/engines.json', true);
        GameSystem.game.load.json('modules', 'lib/modules.json', true);
    },

    create: function() {
        //GameSystem.game.cache.destroy(); // Remove existing cache (may be needed for testing or to save memory)
        
        // Store JSON data in memory
        GameSystem.game.settings = GameSystem.game.cache.getJSON('settings');
        GameSystem.game.assets = GameSystem.game.cache.getJSON('assets');
        GameSystem.game.menu = GameSystem.game.cache.getJSON('menu');
        GameSystem.game.docks = GameSystem.game.cache.getJSON('docks');
        GameSystem.game.missions = GameSystem.game.cache.getJSON('missions');
        GameSystem.game.ships = GameSystem.game.cache.getJSON('ships');
        GameSystem.game.weapons = GameSystem.game.cache.getJSON('weapons');
        GameSystem.game.shields = GameSystem.game.cache.getJSON('shields');
        GameSystem.game.generators = GameSystem.game.cache.getJSON('generators');
        GameSystem.game.engines = GameSystem.game.cache.getJSON('engines');
        GameSystem.game.modules = GameSystem.game.cache.getJSON('modules');

        GameObject.state.start('menu');
    }
};