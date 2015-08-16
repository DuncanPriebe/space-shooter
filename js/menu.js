var menuState = {
	//menuThis: {}, // Store a reference to this object	

	create: function() {
		menuThis = this; // Define reference to this object        

		// Create menu structure
		mainMenu = new node("MAIN MENU", "root");
			mainMenu.addChild(new node("NEW GAME"));			
			mainMenu.addChild(new node("LOAD GAME"));			
			mainMenu.addChild(controls = new node("CONTROLS"));
				controls.addChild(new node("MOVE LEFT - LEFT ARROW"));
				controls.addChild(new node("MOVE RIGHT - RIGHT ARROW"));				
				controls.addChild(new node("FIRE - SPACEBAR"));
			mainMenu.addChild(audio = new node("AUDIO"));
				audio.addChild(sfxVolume = new node("SFX VOLUME"));
                    sfxVolume.addChild(new node("VOLUME"));
				audio.addChild(musicVolume = new node("MUSIC VOLUME"));
                    musicVolume.addChild(new node("VOLUME"));
			mainMenu.addChild(video = new node("VIDEO"));
				video.addChild(new node("RESOLUTION"));
            mainMenu.addChild(new node("QUIT"));

		// Set menu style
		mainMenu.titleFont = '30px Courier';
		mainMenu.titleFontColor = '#bb6688';
		mainMenu.titleFontWeight = 'bold';
		mainMenu.titleFontStyle = 'normal';
		mainMenu.font = '20px Courier';
		mainMenu.fontWeight = 'bold';
		mainMenu.fontStyle = 'normal';
		mainMenu.defaultFontColor = '#ffffff';
		mainMenu.selectedFontColor = '#70ba70';

		currentMenu = mainMenu; // Set default menu
        mainMenu.children[0].select(); // Set default selected menu
		selectedMenu = mainMenu.children[0]; // Set default selected option

		menuText = []; // Store the text on the screen so it can be deleted
        
        
        game.add.text(80, 20, 'ZYRIAN', {font: '90px Courier', fill: '#ba7070', fontStyle: 'normal', fontWeight: 'bold'});        
		
        this.updateMenu();

        var upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        upKey.onDown.add(this.moveSelection, this);
        var downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        downKey.onDown.add(this.moveSelection, this);
        var backKey = game.input.keyboard.addKey(Phaser.Keyboard.BACKSPACE);
        backKey.onDown.add(this.moveSelection, this);
        var escapeKey = game.input.keyboard.addKey(Phaser.Keyboard.ESC);
        escapeKey.onDown.add(this.moveSelection, this);
        var enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);        
        enterKey.onDown.add(this.moveSelection, this);
    },

    moveSelection: function(key) {        
    	switch (key.keyCode) {
    		case 38: // Up arrow pressed
    			selectedMenu = selectedMenu.getPreviousSibling();
                selectedMenu.select();
    			menuThis.updateMenu();
    			break;
    		case 40: // Down arrow pressed
    			selectedMenu = selectedMenu.getNextSibling();
                selectedMenu.select();
    			menuThis.updateMenu();
    			break;
    		case 8: // Backspace pressed
            case 27: //Escape pressed
    			if (typeof currentMenu.parent != 'undefined') { // If the current menu has a parent menu, display it
    				currentMenu = currentMenu.parent;
    				for (i in currentMenu.children) {
                        if (currentMenu.children[i].selected) {
                            selectedMenu = currentMenu.children[i];
                        }
                    }                    
    			}
    			menuThis.updateMenu();
    			break;
    		case 13: // Enter pressed
    			if (selectedMenu.hasChildren()) { // If the selected item has a submenu, display it
    				currentMenu = selectedMenu;
    				selectedMenu = selectedMenu.children[0];
                    selectedMenu.select();
    				menuThis.updateMenu();
    			} else { // Otherwise execute the appropriate command
    				menuThis.menuExecute();
    			}
    			//game.state.start('play', true, false, missions[0], weapons, settings); // Start play state with parameters
    			break;
    	}
    },

    // Load and display mission options
    menuExecute: function() {
    	switch(selectedMenu.name) {
    		case "NEW GAME":
                game.currentDock = game.docks[0];
    			game.state.start('dock', true, false, game.currentDock);
    			break;
    		case "LOAD GAME":
    			// Load game data from save file and then launch the game at the appropriate stage
    			break;
    		case "VOLUME":
    			console.log("Changing volume");
    			break;
    	}
    },

   	// Update menu options
    updateMenu: function() {
    	// Remove existing menu text
    	for (i in menuText) {
    		menuText[i].destroy();
    	}

    	// If the selected menu has children, display them
    	if (currentMenu.children.length > 0) {
    		menuText.push(game.add.text(80, 150, currentMenu.name, {font: mainMenu.titleFont, fontStyle: mainMenu.titleFontStyle, fontWeight: mainMenu.titleFontWeight, fill: mainMenu.titleFontColor})); // Add the current menu name
    		for (var i in currentMenu.children)	 {    			
                menuColor = (currentMenu.children[i].selected) ? mainMenu.selectedFontColor : mainMenu.defaultFontColor;
    			menuText.push(game.add.text(80, i * 30 + 200, currentMenu.children[i].name, {font: mainMenu.font, fontStyle: mainMenu.fontStyle, fontWeight: mainMenu.fontWeight, fill: menuColor})); // Add menu children names
    		}
    	}
    }    
};