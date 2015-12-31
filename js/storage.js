'use strict';

/*-----------------------------------------------------------------------
                            Saving and Loading
-----------------------------------------------------------------------*/

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