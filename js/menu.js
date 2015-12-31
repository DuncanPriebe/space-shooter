'use strict';

/*-----------------------------------------------------------------------
                          Menu Structure
-----------------------------------------------------------------------*/

// Define class for creating menu structure
GameSystem.node = function(name, pointer, type) {
    this.name = name || "node"; // The name to be displayed
    this.pointer = pointer || {}; // The object linked to the node
    this.type = type || "leaf"; // The type of node (for executing node command)    
    this.selected = false;
    this.parent = {};
    this.children = [];
}

// Select the node
GameSystem.node.prototype.select = function() {        
    var siblings = this.getSiblings();
    for (var i in siblings) {
        siblings[i].deselect(); // Deselect siblings
    }        
    this.selected = true;
}

// Deselect the node
GameSystem.node.prototype.deselect = function() {
    this.selected = false;
}

// Return selected node
GameSystem.node.prototype.getSelected = function() {
	for (var i in this.children) {
		if (this.children[i].selected == true) {
			return this.children[i];
		}
	}
}

// Add a child node
GameSystem.node.prototype.addChild = function(name, pointer, type) {
    var child = new GameSystem.node(name, pointer, type);
    this.children.push(child);
    child.parent = this;
    
    // If this is the first child of the parent, then select it by default
	if (child.getSiblings().indexOf(child) == 0) {
		child.select();
	}
    return child;
}

// Return siblings of a node (and the node itself)
GameSystem.node.prototype.getSiblings = function() {
    return (typeof this.parent !== "undefined") ? this.parent.children : this;
}

// Return first sibling
GameSystem.node.prototype.getFirstSibling = function() {
    var siblings = this.getSiblings();
    var youngest = siblings[0];
    for (var i = siblings.length; i >= 0; i--) {
        if (i < this.getSiblings().indexOf(this)) {
            youngest = siblings[i];
        }
    }
    return youngest;
}

// Return last sibling
GameSystem.node.prototype.getLastSibling = function() {
    var siblings = this.getSiblings();
    var oldest = siblings[0];
    for (var i in siblings) {
        if (i > this.getSiblings().indexOf(this)) {
            oldest = siblings[i];
        }
    }
    return oldest;
}

// Select the parent (or the current selection)
GameSystem.node.prototype.selectParent = function() {
	var parent = (this.parent.type != "root") ? this.parent : this;
	parent.select();
	parent.update();
	return parent;
}

// Select the grandparent (used for creating menu nodes that leave the current menu)
GameSystem.node.prototype.selectGrandparent = function() {
    if (this.parent.parent.type == "root") {
        parent = this.parent.parent;
    } else {
        parent = this.parent.selectParent();
    }
    parent.select();
    parent.update();
    return parent;
}

// Select previous sibling (or the last sibling)
GameSystem.node.prototype.selectPrevious = function() {
	var previous = (this.getSiblings().indexOf(this) - 1 >= 0) ? this.getSiblings()[this.getSiblings().indexOf(this) - 1] : this.getLastSibling();
	previous.select();
	previous.update();
	return previous;
}

// Select next sibling (or the last sibling)
GameSystem.node.prototype.selectNext = function() {
	var next = (this.getSiblings().indexOf(this) + 1 < this.getSiblings().length) ? this.getSiblings()[this.getSiblings().indexOf(this) + 1] : this.getFirstSibling();
	next.select();
	next.update();
	return next;
}

// Select next child (or the current selection)
GameSystem.node.prototype.selectChild = function() {
	// Show children of selected node, otherwise execute node command
	var child;
	if (this.children.length > 0) {
		child = this.getSelected();
	} else {
		child = this.execute();
        if (typeof child == "undefined") {
            child = this;
        } else {
            child = child.getSelected();
        }
	}
    child.select();
    child.update();
    return child;
}

// Check if node has children
GameSystem.node.prototype.hasChildren = function() {
    return (this.children.length > 0) ? true : false;
}

GameSystem.node.prototype.update = function() {
	GameSystem.clearMenu();

	var siblings = this.getSiblings();

    // Add the current menu name
	GameSystem.game.text.push(GameSystem.game.add.text(GameSystem.data.menu.fonts.menuTitle.xPosition, GameSystem.data.menu.fonts.menuTitle.yPosition, this.parent.name, GameSystem.data.menu.fonts.menuTitle));

    // Add menu children names
	for (var i in siblings) {
		var font = (siblings[i].selected) ? GameSystem.data.menu.fonts.selected : GameSystem.data.menu.fonts.unselected;
		GameSystem.game.text.push(GameSystem.game.add.text(font.xPosition, i * font.ySpacing + font.yPosition, siblings[i].name, font));
	}

    // Display information about selected node
    switch (this.type) {
        case "vendor": 
            var font = GameSystem.data.menu.fonts.help;
            //font.fill = "#" + this.pointer.tintColor;
            font.fill = "#" + this.pointer.faction.color;
            GameSystem.game.text.push(GameSystem.game.add.text(GameSystem.data.menu.fonts.help.xPosition, GameSystem.data.menu.fonts.help.yPosition, this.pointer.type.toUpperCase() + " VENDOR", font));
            break;
        case "item":
        case "ship":
        case "weapon":
        case "shield":
        case "engine":
        case "generator":
        case "module":
            var font = GameSystem.data.menu.fonts.help;
            font.fill = "#" + this.pointer.tintColor;
            var counter = 0;
            GameSystem.game.text.push(GameSystem.game.add.text(GameSystem.data.menu.fonts.help.xPosition, counter * GameSystem.data.menu.fonts.help.ySpacing + GameSystem.data.menu.fonts.help.yPosition, "COST: " + this.pointer.value, font));
            counter++;
            var text = "";
            for (var i in this.pointer.stats) {
                GameSystem.game.text.push(GameSystem.game.add.text(GameSystem.data.menu.fonts.help.xPosition, counter * GameSystem.data.menu.fonts.help.ySpacing + GameSystem.data.menu.fonts.help.yPosition, i.toUpperCase() + " " + this.pointer.stats[i], font));
                counter++;
            }
            break;
        case "mission":
            var font = GameSystem.data.menu.fonts.help;
            font.fill = "#" + this.pointer.faction.color;
            GameSystem.game.text.push(GameSystem.game.add.text(GameSystem.data.menu.fonts.help.xPosition, GameSystem.data.menu.fonts.help.yPosition, "LAUNCH MISSION", font));
            break;
        case "faction":
            var font = GameSystem.data.menu.fonts.help;
            font.fill = "#" + this.pointer.color;
            GameSystem.game.text.push(GameSystem.game.add.text(GameSystem.data.menu.fonts.help.xPosition, GameSystem.data.menu.fonts.help.yPosition, this.pointer.description, font));
            break;
    }
}

// Execute node command
GameSystem.node.prototype.execute = function() {
	// First see if we are doing something with an object referenced by the node 
    switch (this.type) {
        case "mission":
            GameSystem.game.state.start("play", true, false, this.pointer);
            break;
        // We're selecting an item
        case "item":
            if (GameSystem.playerEntity.money < this.pointer.value) {
                console.log("Item is too expensive");
            } else {
                return GameSystem.viewShip(this, "buy", this.pointer);
            }
            break;
        // We're selecting a weapon from the ship menu
        case "weapon":
            //console.log(this.pointer);
            break;
        // Otherwise execute special instructions
        default:
            switch (this.name) {
            case "NEW GAME": // Start new game
                GameSystem.storage.reset();
                GameSystem.game.state.start("dock", true, false, 0);
                break;
            case "CONTINUE": // Continue game
                GameSystem.storage.load();
                GameSystem.game.state.start("dock", true, false, GameSystem.playerEntity.worldIndex);
                break;
            case "SAVE GAME": // Save game
                GameSystem.storage.save();
                break;
            case "RESET GAME": // Reset game
                GameSystem.storage.reset();
                break;
            case "ERASE DATA": // Erase game
                GameSystem.storage.erase();
                break;
            case "QUIT": // Quit current menu
                if (GameSystem.game.state.current == "menu") { // If we're in the main menu, exit the game
                    console.log("Exiting game...");
                } else if (GameSystem.game.state.current == "dock") { // If we're in a dock, go to the main menu
                    GameSystem.game.state.start('menu');
                }
                break;
            case "DONE": // Leave current menu
                return this.selectGrandparent();
                break;
        }
    }
}

/*-----------------------------------------------------------------------
                      Additional Screens and Menus
-----------------------------------------------------------------------*/

// Show player's ship
GameSystem.viewShip = function(parent, action, item) {
    if (typeof action != "undefined" && typeof item == "undefined") {
        console.log("Error: can't buy or sell undefined item.");
    } else {
        // Show the player's ship
        var shipSprite = GameSystem.game.add.sprite(300, 400, "ship-4");
        shipSprite.scale.setTo(3, 3);

        var primaryWeaponMenu = parent.addChild("PRIMARY WEAPONS")
            for (var i = 0; i < GameSystem.playerEntity.ship.primaryWeaponSlots; i++) {
                if (typeof GameSystem.playerEntity.primaryWeapons[i] !== "undefined") {
                    primaryWeaponMenu.addChild(GameSystem.playerEntity.primaryWeapons[i].name.toUpperCase(), GameSystem.playerEntity.primaryWeapons[i], "weapon");
                } else {
                    primaryWeaponMenu.addChild("EMPTY SLOT", {}, "weapon");
                }
            }
            primaryWeaponMenu.addChild("DONE");
        
        var secondaryWeaponMenu = parent.addChild("SECONDARY WEAPONS")
            for (var i = 0; i < GameSystem.playerEntity.ship.secondaryWeaponSlots; i++) {
                if (typeof GameSystem.playerEntity.secondaryWeapons[i] !== "undefined") {
                    secondaryWeaponMenu.addChild(GameSystem.playerEntity.secondaryWeapons[i].name.toUpperCase(), GameSystem.playerEntity.secondaryWeapons[i], "weapon");
                } else {
                    secondaryWeaponMenu.addChild("EMPTY SLOT", {}, "weapon");
                }
            }
            secondaryWeaponMenu.addChild("DONE");

        var shieldMenu = parent.addChild("SHIELD")
            if (typeof GameSystem.playerEntity.shield !== "undefined") {
                shieldMenu.addChild(GameSystem.playerEntity.shield.name.toUpperCase(), GameSystem.playerEntity.shield, "shield");
            } else {
                shieldMenu.addChild("EMPTY SLOT", {}, "shield");
            }
            shieldMenu.addChild("DONE");

        var engineMenu = parent.addChild("ENGINE")
            if (typeof GameSystem.playerEntity.engine !== "undefined") {
                engineMenu.addChild(GameSystem.playerEntity.engine.name.toUpperCase(), GameSystem.playerEntity.engine, "engine");
            } else {
                engineMenu.addChild("EMPTY SLOT", {}, "engine");
            }
            engineMenu.addChild("DONE");

        var generatorMenu = parent.addChild("GENERATOR")
            if (typeof GameSystem.playerEntity.generator !== "undefined") {
                generatorMenu.addChild(GameSystem.playerEntity.generator.name.toUpperCase(), GameSystem.playerEntity.generator, "generator");
            } else {
                generatorMenu.addChild("EMPTY SLOT", {}, "generator");
            }
            generatorMenu.addChild("DONE");

        var moduleMenu = parent.addChild("MODULES")
            for (var i = 0; i < GameSystem.playerEntity.ship.moduleSlots; i++) {
                if (typeof GameSystem.playerEntity.modules[i] !== "undefined") {
                    moduleMenu.addChild(GameSystem.playerEntity.modules[i].name.toUpperCase(), GameSystem.playerEntity.modules[i], "module");
                } else {
                    moduleMenu.addChild("EMPTY SLOT", {}, "module");
                }
            }
            moduleMenu.addChild("DONE");

        parent.addChild("DONE");
    }
    return parent;
}

// Remove menu text and sprites
GameSystem.clearMenu = function() {
    for (var i in GameSystem.game.text) {
        GameSystem.game.text[i].destroy();
    }
}