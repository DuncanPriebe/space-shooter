'use strict';

var dockState = {
    init: function(dock) {
        // Load current dock, otherwise load first dock
        GameSystem.game.dock = dock || GameSystem.game.docks[0];
    },

    preload: function() {
        // Load state assets
        GameSystem.loadStateAssets(this.key); // Little bit of lag loading audio for dock menu, but not for main menu. Not sure why...
    },

    create: function() {
        GameSystem.game.add.text(80, 80, GameSystem.game.dock.name, GameSystem.game.menu.fonts.title);

        // Create menu structure
        var mainMenu = new GameSystem.node("SPACE DOCK", "root");
            var missionMenu = mainMenu.addChild("MISSIONS");
                for (var i in GameSystem.game.missions) {
                    missionMenu.addChild(GameSystem.game.missions[i].name, "mission");
                }
            var vendorMenu = mainMenu.addChild("VENDORS");
                for (var i in GameSystem.game.dock.vendors) {
                    vendorMenu.addChild(GameSystem.game.dock.vendors[i].name, "vendor");
                }
            mainMenu.addChild("SAVE GAME");
            mainMenu.addChild("RESET GAME");
            mainMenu.addChild("ERASE DATA");
            mainMenu.addChild("QUIT");

        GameSystem.game.menu.selected = mainMenu.getSelected(); // Set default selected menu
        
        GameSystem.game.menu.selected.update(); // Print the menu

        // Store assets in game variables
        GameSystem.game.menu.audio.music = GameSystem.game.add.audio(GameSystem.game.menu.audio.music, GameSystem.game.menu.audio.musicVolume);
        GameSystem.game.menu.audio.move = GameSystem.game.add.audio(GameSystem.game.menu.audio.moveSound, GameSystem.game.menu.audio.sfxVolume);
        GameSystem.game.menu.audio.accept = GameSystem.game.add.audio(GameSystem.game.menu.audio.acceptSound, GameSystem.game.menu.audio.sfxVolume);
        GameSystem.game.menu.audio.back = GameSystem.game.add.audio(GameSystem.game.menu.audio.backSound, GameSystem.game.menu.audio.sfxVolume);

        // GameSystem.game.menu.audio.music.play(); // Start music

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
                GameSystem.game.menu.selected = GameSystem.game.menu.selected.selectPrevious();
                GameSystem.game.menu.audio.move.play();
                break;
            case 40: // Down arrow pressed
                GameSystem.game.menu.selected = GameSystem.game.menu.selected.selectNext();
                GameSystem.game.menu.audio.move.play();
                break;
            case 13: // Enter pressed
                GameSystem.game.menu.selected = GameSystem.game.menu.selected.selectChild();
                GameSystem.game.menu.audio.accept.play();
                //GameSystem.game.state.start('play', true, false, missions[0], weapons, settings); // Start play state with parameters
                break;
            case 8: // Backspace pressed
            case 27: // Escape pressed
                GameSystem.game.menu.selected = GameSystem.game.menu.selected.selectParent();
                GameSystem.game.menu.audio.back.play();
                break;
        }
    }
};