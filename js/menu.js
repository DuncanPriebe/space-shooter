var menuState = {
	//menuThis: {}, // Store a reference to this object

    init: function() {
        menuThis = this; // Define reference to this object
    },

	create: function() {
        game.add.text(80, 20, 'ZYRIAN', {font: '90px Courier', fill: '#ba7070', fontStyle: 'normal', fontWeight: 'bold'});

        // Create menu structure
        mainMenu = new node("MAIN MENU", "root");
            mainMenu.addChild(new node("NEW GAME"));            
            mainMenu.addChild(new node("CONTINUE"));           
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

        sfxMenu = {};

        sfxMenu.move = game.add.audio('sfx-explosion');
        sfxMenu.move.volume = 0.2;
        sfxMenu.accept = game.add.audio('sfx-explosion2');
        sfxMenu.accept.volume = 0.2;
        sfxMenu.back = game.add.audio('sfx-laser2');
        sfxMenu.back.volume = 0.2;
    },

    moveSelection: function(key) {
        console.log(key.keyCode);
    	switch (key.keyCode) {
    		case 38: // Up arrow pressed
    			selectedMenu = selectedMenu.getPreviousSibling();
                selectedMenu.select();
                sfxMenu.move.play();
    			menuThis.updateMenu();
    			break;
    		case 40: // Down arrow pressed
    			selectedMenu = selectedMenu.getNextSibling();
                selectedMenu.select();
                sfxMenu.move.play();
    			menuThis.updateMenu();
    			break;
    		case 8: // Backspace pressed
            case 27: //Escape pressed
    			if (typeof currentMenu.parent !== "undefined") { // If the current menu has a parent menu, display it
    				currentMenu = currentMenu.parent;
    				for (i in currentMenu.children) {
                        if (currentMenu.children[i].selected) {
                            selectedMenu = currentMenu.children[i];
                        }
                    }
                    sfxMenu.back.play();
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
                sfxMenu.accept.play();
    			//game.state.start('play', true, false, missions[0], weapons, settings); // Start play state with parameters
    			break;
    	}
    },

    // Load and display mission options
    menuExecute: function() {
    	switch(selectedMenu.name) {
    		case "NEW GAME":
                menuThis.resetData();
                game.currentDock = game.docks[0];
    			game.state.start('dock', true, false, game.currentDock);
    			break;
    		case "CONTINUE":
                menuThis.loadData();
    			break;
    		case "VOLUME":
    			console.log("Changing volume");
                menuThis.resetStorage();
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
    },

    // Load data from web storage
    loadData: function() {
        // Verify web storage and existing data
        if (typeof Storage !== "undefined") {
            if (true) { // Need to test for valid game data
                console.log("Loading game data from web storage.");

                // Load data from web storage
                var zyrian = localStorage.getItem('zyrian');
                zyrian = JSON.parse(zyrian);

            } else {
                console.log("Nonexistant or corrupt game data in web storage. Unable to load game data.");
            }
        } else {
            console.log("Web storage not supported. Unable to load game data.");
        }
    },

    // Reset data in memory
    resetData: function() {
        console.log("Resetting game data in memory.");
        zyrian = {
            ship: {},
            weapons: [],
            shield: {},
            generator: {},
            engine: {},
            modules: [],
            dock: {},
            money: startingMoney
        };
    },

    // Reset data in web storage
    resetStorage: function() {
        // Verify web storage
        if (typeof Storage !== "undefined") {
            localStorage.removeItem("zyrian"); // Delete data in web storage

            // Store game data as a stringified object
            var zyrian = {
                'ship': {},
                'weapons': [],
                'shield': {},
                'generator': {},
                'engine': {},
                'modules': [],
                'dock': {},
                'money': startingMoney
            };

            localStorage.setItem('zyrian', JSON.stringify(zyrian)); // Put data into web storage

            // Load data in memory
            var zyrian = localStorage.getItem('zyrian');
            zyrian = JSON.parse(zyrian);
        } else {
            console.log("Web storage not supported. Unable to load game data.");
        }
    }
};