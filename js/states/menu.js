'use strict';

var menuState = {

    preload: function() {
        // Load state assets
        GameSystem.loadStateAssets(this.key);
    },

	create: function() {
        GameSystem.game.add.text(80, 80, GameSystem.game.menu.title + " v" + GameSystem.game.settings.version, GameSystem.game.menu.fonts.title);

        // Create menu structure
        var mainMenu = new GameSystem.node("MAIN MENU", "root");
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
                break;
    		case 8: // Backspace pressed
            case 27: // Escape pressed
                GameSystem.game.menu.selected = GameSystem.game.menu.selected.selectParent();
                GameSystem.game.menu.audio.back.play();
    			break;
    	}
    }
};