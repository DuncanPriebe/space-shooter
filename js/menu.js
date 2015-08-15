var menuState = {
	//menuThis: {}, // Store a reference to this object	

	create: function() {
		menuThis = this; // Define reference to this object

		// Create menu structure
		menu = new node("MAIN MENU");
			menu.addChild(missions = new node("MISSIONS"));
				for (var i in game.missions) {
					missions.addChild(new node(game.missions[i].name));
				}
			menu.addChild(controls = new node("CONTROLS"));
				controls.addChild(new node("MOVE LEFT"));
				controls.addChild(new node("MOVE RIGHT"));
				controls.addChild(new node("MOVE UP"));
				controls.addChild(new node("MOVE DOWN"));
			menu.addChild(audio = new node("AUDIO"));
				audio.addChild(new node("SFX VOLUME"));
				audio.addChild(new node("MUSIC VOLUME"));
			menu.addChild(video = new node("VIDEO"));
				video.addChild(new node("RESOLUTION"));

		// Set menu style
		menu.titleFont = '30px Courier';
		menu.titleFontColor = '#bb6688';
		menu.titleFontWeight = 'bold';
		menu.titleFontStyle = 'normal';
		menu.font = '20px Courier';
		menu.fontWeight = 'bold';
		menu.fontStyle = 'normal';
		menu.defaultFontColor = '#ffffff';
		menu.selectedFontColor = '#70ba70';

		currentMenu = menu; // Set default menu
		selectedMenu = menu.children[0]; // Set default selected option

		menuText = []; // Store the text on the screen so it can be deleted
        
        game.add.text(80, 20, 'ZYRIAN', {font: '90px Courier', fill: '#ba7070', fontStyle: 'normal', fontWeight: 'bold'});
        game.add.text(80, 150, 'left arrow = move left', {font: '16px Courier', fill: '#cccccc'});
        game.add.text(80, 170, 'right arrow = move right', {font: '16px Courier', fill: '#cccccc'});
        game.add.text(80, 190, 'spacebar = fire laser', {font: '16px Courier', fill: '#cccccc'});
        game.add.text(80, 240, 'press enter to start', {font: '20px Courier', fill: '#7070ba', fontWeight: 'bold'});
		
        this.updateMenu();

        var upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        upKey.onDown.add(this.moveSelection, this);
        var downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        downKey.onDown.add(this.moveSelection, this);
        var backKey = game.input.keyboard.addKey(Phaser.Keyboard.BACKSPACE);
        backKey.onDown.add(this.moveSelection, this);
        var enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);        
        //enterKey.onDown.addOnce(this.moveSelection, this);
        enterKey.onDown.add(this.moveSelection, this);
    },

    moveSelection: function(key) {    	
    	switch (key.keyCode) {
    		case 38: // Up arrow pressed
    			selectedMenu = selectedMenu.getLastSibling();
    			menuThis.updateMenu();
    			break;
    		case 40: // Down arrow pressed
    			selectedMenu = selectedMenu.getNextSibling();
    			menuThis.updateMenu();
    			break;
    		case 8: // Backspace pressed
    			if (typeof currentMenu.parent != 'undefined') { // If the current menu has a parent menu, display it
    				currentMenu = currentMenu.parent;
    				selectedMenu = currentMenu.children[0];
    			}    			
    			menuThis.updateMenu();
    			break;
    		case 13: // Enter pressed    			
    			if (selectedMenu.hasChildren()) { // If the selected item has a submenu, display it
    				currentMenu = selectedMenu;
    				selectedMenu = selectedMenu.children[0];
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
    		case "Tyrian Orbital Platform":
    			console.log("Starting mission");
    			game.state.start('play', true, false, game.missions[0]); // Start play state with parameters   			
    			break;
    		case "SFX VOLUME":
    			console.log("Changing SFX volume");
    			break;
    		case "MUSIC VOLUME":
    			console.log("Changing music volume");
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
    		menuText.push(game.add.text(80, 270, currentMenu.name, {font: menu.titleFont, fontStyle: menu.titleFontStyle, fontWeight: menu.titleFontWeight, fill: menu.titleFontColor})); // Add the current menu name
    		for (var i in currentMenu.children)	 {
    			menuColor = (selectedMenu == currentMenu.children[i]) ? menu.selectedFontColor : menu.defaultFontColor;
    			menuText.push(game.add.text(80, i * 30 + 310, currentMenu.children[i].name, {font: menu.font, fontStyle: 'normal', fontWeight: 'bold', fill: menuColor})); // Add menu children names
    		}
    	}
    }    
};

// Define menu structure
function node(name) {
	this.name = name || "";	
	this.parent;
	this.children = [];

	this.addChild = function(child) {
		this.children.push(child);
		child.parent = this;		
	}

	this.getChildren = function() {
		var children = [];
		if (this.children != undefined) {
			for (n in this.children) {
				children.push(this.children[n]);
				getChildren(this.children[n]);
			}
		}
		return children;	
	}

	this.getSiblings = function() {
		return this.parent.children;
	}

	this.getLastSibling = function() {		
		return (this.getSiblings().indexOf(this) - 1 >= 0) ? this.getSiblings()[this.getSiblings().indexOf(this) - 1] : this;
	}	

	this.getNextSibling = function() {
		return (this.getSiblings().indexOf(this) + 1 < this.getSiblings().length) ? this.getSiblings()[this.getSiblings().indexOf(this) + 1] : this;
	}

	this.hasChildren = function() {
		return (this.children.length > 0) ? true : false;
	}
}