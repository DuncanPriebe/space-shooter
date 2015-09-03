'use strict';

var menuState = {

    preload: function() {
        // Load state assets
        GameSystem.loadStateAssets(this.key);

        GameSystem.initialize("fonts");
    },

	create: function() {
        GameSystem.game.add.text(GameSystem.data.menu.fonts.gameTitle.xPosition, GameSystem.data.menu.fonts.gameTitle.yPosition, GameSystem.data.menu.title + " v" + GameSystem.data.settings.version, GameSystem.data.menu.fonts.gameTitle);

        // Create menu structure
        var mainMenu = new GameSystem.node("MAIN MENU", {}, "root");
            mainMenu.addChild("CONTINUE");
            mainMenu.addChild("NEW GAME");
            var controlMenu = mainMenu.addChild("CONTROLS");
                controlMenu.addChild("MOVE LEFT = LEFT ARROW");
                controlMenu.addChild("MOVE RIGHT = RIGHT ARROW");
                controlMenu.addChild("FIRE = SPACEBAR");
                controlMenu.addChild("DONE");
            var audioMenu = mainMenu.addChild("AUDIO");
                audioMenu.addChild("SFX VOLUME");
                audioMenu.addChild("MUSIC VOLUME");
                audioMenu.addChild("DONE");
            var videoMenu = mainMenu.addChild("VIDEO");
                var resolutionMenu = videoMenu.addChild("RESOLUTION");
                    resolutionMenu.addChild("800 X 600");
                    resolutionMenu.addChild("640 X 480");
                    resolutionMenu.addChild("480 X 360");
                    resolutionMenu.addChild("DONE");
                videoMenu.addChild("DONE");
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
                break;
    		case 8: // Backspace pressed
            case 27: // Escape pressed
                GameSystem.menu.selected = GameSystem.menu.selected.selectParent();
                GameSystem.menu.audio.back.play();
    			break;
    	}
    }
};