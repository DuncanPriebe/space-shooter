'use strict';

var menuState = {

    preload: function() {
        // Load state assets
        GameSystem.loadStateAssets(this.key);
    },

	create: function() {
        GameSystem.game.add.text(80, 80, GameSystem.data.menu.title + " v" + GameSystem.data.settings.version, GameSystem.data.menu.fonts.title);

        // Create menu structure
        var mainMenu = new GameSystem.node("MAIN MENU", {}, "root");
            mainMenu.addChild("NEW GAME");
            mainMenu.addChild("CONTINUE");
            var controlMenu = mainMenu.addChild("CONTROLS");
                controlMenu.addChild("MOVE LEFT = LEFT ARROW");
                controlMenu.addChild("MOVE RIGHT = RIGHT ARROW");
                controlMenu.addChild("FIRE = SPACEBAR");
            var audioMenu = mainMenu.addChild("AUDIO");
                audioMenu.addChild("SFX VOLUME");
                audioMenu.addChild("MUSIC VOLUME");
            var videoMenu = mainMenu.addChild("VIDEO");
                var resolutionMenu = videoMenu.addChild("RESOLUTION");
                    resolutionMenu.addChild("800 X 600");
                    resolutionMenu.addChild("640 X 480");
                    resolutionMenu.addChild("480 X 360");
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
                break;
    		case 8: // Backspace pressed
            case 27: // Escape pressed
                GameSystem.data.menu.selected = GameSystem.data.menu.selected.selectParent();
                GameSystem.data.menu.audio.back.play();
    			break;
    	}
    }
};