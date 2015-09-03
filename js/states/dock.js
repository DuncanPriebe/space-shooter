'use strict';

var dockState = {
    init: function(worldIndex) {
        // Load current dock, otherwise load first dock
        //world.faction = GameSystem.getWorldFaction(world);
        GameSystem.currentWorld = new GameSystem.world(0);
    },

    preload: function() {
        // Load state assets
        GameSystem.loadStateAssets(this.key); // Little bit of lag loading audio for dock menu, but not for main menu. Not sure why...
    },

    create: function() {
        GameSystem.game.add.text(GameSystem.data.menu.fonts.gameTitle.xPosition, GameSystem.data.menu.fonts.gameTitle.yPosition, GameSystem.data.menu.title + " v" + GameSystem.data.settings.version, GameSystem.data.menu.fonts.gameTitle);

        // Create menu structure
        var mainMenu = new GameSystem.node("SPACE DOCK", {}, "root");
            mainMenu.addChild(GameSystem.currentWorld.name.toUpperCase() + " Station".toUpperCase(), GameSystem.currentWorld, "mission");

            var vendorMenu = mainMenu.addChild("VENDORS");
                var weaponVendor = new GameSystem.vendor(GameSystem.currentWorld, "weapons");
                var weaponVendorMenu = vendorMenu.addChild(weaponVendor.name.toUpperCase(), weaponVendor, "vendor");
                for (var i in weaponVendor.items) {
                    weaponVendorMenu.addChild(weaponVendor.items[i].name.toUpperCase(), weaponVendor.items[i], "item");
                }
                    weaponVendorMenu.addChild("DONE");

                vendorMenu.addChild("DONE");
            var archiveMenu = mainMenu.addChild("DATA ARCHIVE");
                for (var i in GameSystem.data.factions) {
                    archiveMenu.addChild(GameSystem.data.factions[i].name.toUpperCase(), GameSystem.data.factions[i], "faction");
                }
                archiveMenu.addChild("DONE");
            mainMenu.addChild("SAVE GAME");
            mainMenu.addChild("RESET GAME");
            mainMenu.addChild("ERASE DATA");
            mainMenu.addChild("QUIT");

        GameSystem.menu.selected = mainMenu.getSelected(); // Set default selected menu
        
        GameSystem.menu.selected.update(); // Print the menu

        // Store assets in game variables
        GameSystem.menu.audio.music = GameSystem.game.add.audio(GameSystem.data.menu.audio.music, GameSystem.data.menu.audio.musicVolume);
        GameSystem.menu.audio.move = GameSystem.game.add.audio(GameSystem.data.menu.audio.moveSound, GameSystem.data.menu.audio.sfxVolume);
        GameSystem.menu.audio.accept = GameSystem.game.add.audio(GameSystem.data.menu.audio.acceptSound, GameSystem.data.menu.audio.sfxVolume);
        GameSystem.menu.audio.back = GameSystem.game.add.audio(GameSystem.data.menu.audio.backSound, GameSystem.data.menu.audio.sfxVolume);

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
                GameSystem.menu.selected = GameSystem.menu.selected.selectPrevious();
                GameSystem.menu.audio.move.play();
                break;
            case 40: // Down arrow pressed
                GameSystem.menu.selected = GameSystem.menu.selected.selectNext();
                GameSystem.menu.audio.move.play();
                break;
            case 13: // Enter pressed
                GameSystem.menu.selected = GameSystem.menu.selected.selectChild();
                GameSystem.menu.audio.accept.play();
                //GameSystem.game.state.start('play', true, false, missions[0], weapons, settings); // Start play state with parameters
                break;
            case 8: // Backspace pressed
            case 27: // Escape pressed
                GameSystem.menu.selected = GameSystem.menu.selected.selectParent();
                GameSystem.menu.audio.back.play();
                break;
        }
    }
};