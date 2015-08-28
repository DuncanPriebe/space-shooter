'use strict';

var dockState = {
    init: function(dock) {
        // Load current dock, otherwise load first dock
        GameSystem.game.dock = dock || GameSystem.data.docks[0];
    },

    preload: function() {
        // Load state assets
        GameSystem.loadStateAssets(this.key); // Little bit of lag loading audio for dock menu, but not for main menu. Not sure why...
    },

    create: function() {
        GameSystem.game.add.text(80, 80, GameSystem.game.dock.name, GameSystem.data.menu.fonts.title);

        // Create menu structure
        var mainMenu = new GameSystem.node("SPACE DOCK", "root");
            var missionMenu = mainMenu.addChild("MISSIONS");
                for (var i in GameSystem.data.missions) {
                    missionMenu.addChild(GameSystem.data.missions[i].name, "mission");
                }
            var vendorMenu = mainMenu.addChild("VENDORS");
                for (var i in GameSystem.game.dock.vendors) {
                    vendorMenu.addChild(GameSystem.game.dock.vendors[i].name, "vendor");
                }
            var archiveMenu = mainMenu.addChild("DATA ARCHIVE");
                for (var i in GameSystem.data.factions) {
                    archiveMenu.addChild(GameSystem.data.factions[i].name, "faction");
                }
            mainMenu.addChild("SAVE GAME");
            mainMenu.addChild("RESET GAME");
            mainMenu.addChild("ERASE DATA");
            mainMenu.addChild("QUIT");

        GameSystem.data.menu.selected = mainMenu.getSelected(); // Set default selected menu
        
        GameSystem.data.menu.selected.update(); // Print the menu

        // Store assets in game variables
        GameSystem.data.menu.audio.music = GameSystem.game.add.audio(GameSystem.data.menu.audio.music, GameSystem.data.menu.audio.musicVolume);
        GameSystem.data.menu.audio.move = GameSystem.game.add.audio(GameSystem.data.menu.audio.moveSound, GameSystem.data.menu.audio.sfxVolume);
        GameSystem.data.menu.audio.accept = GameSystem.game.add.audio(GameSystem.data.menu.audio.acceptSound, GameSystem.data.menu.audio.sfxVolume);
        GameSystem.data.menu.audio.back = GameSystem.game.add.audio(GameSystem.data.menu.audio.backSound, GameSystem.data.menu.audio.sfxVolume);

        // GameSystem.data.menu.audio.music.play(); // Start music

        // Add menu control keys
        var upKey = GameSystem.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        upKey.onDown.add(this.moveSelection, this);
        var downKey = GameSystem.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        downKey.onDown.add(this.moveSelection, this);
        var backKey = GameSystem.game.input.keyboard.addKey(Phaser.Keyboard.BACKSPACE);
        backKey.onDown.add(this.moveSelection, this);
        var escapeKey = GameSystem.game.input.keyboard.addKey(Phaser.Keyboard.ESC);
        escapeKey.onDown.add(this.moveSelection, this);
        var enterKey = GameSystem.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        enterKey.onDown.add(this.moveSelection, this);
    },

    moveSelection: function(key) {
        switch (key.keyCode) {
            case 38: // Up arrow pressed
                GameSystem.data.menu.selected = GameSystem.data.menu.selected.selectPrevious();
                GameSystem.data.menu.audio.move.play();
                break;
            case 40: // Down arrow pressed
                GameSystem.data.menu.selected = GameSystem.data.menu.selected.selectNext();
                GameSystem.data.menu.audio.move.play();
                break;
            case 13: // Enter pressed
                GameSystem.data.menu.selected = GameSystem.data.menu.selected.selectChild();
                GameSystem.data.menu.audio.accept.play();
                //GameSystem.game.state.start('play', true, false, missions[0], weapons, settings); // Start play state with parameters
                break;
            case 8: // Backspace pressed
            case 27: // Escape pressed
                GameSystem.data.menu.selected = GameSystem.data.menu.selected.selectParent();
                GameSystem.data.menu.audio.back.play();
                break;
        }
    }
};