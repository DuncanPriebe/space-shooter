// Global variables
var projectileTimer = 0;
var projectileSpeed = 400;

var starTime = 0;
var starMinDelay = 300;
var starMaxDelay = 500;
var starSpeed = 150;

var settings; // Store game settings loaded from external file
var missions; // Store mission data loaded from external file
var weapons; // Store weapon data from external file
var shields; // Store shield data from external file

// Define class for creating menu structure
function node(name, type) {
    this.name = name || "node";
    this.type = type || "submenu";
    this.parent;
    this.selected = false;
    this.children = [];

    this.select = function() {        
        var siblings = this.getSiblings();
        for (i in siblings) {
            siblings[i].deselect();
        }        
        this.selected = true;
    }

    this.deselect = function() {
        this.selected = false;
    }

    this.addChild = function(child) {
        this.children.push(child);
        child.parent = this;        
    }    

    this.getChildren = function() {
        var children = [];
        if (this.children != undefined) {
            for (i in this.children) {
                children.push(this.children[i]);
                getChildren(this.children[i]);
            }
        }
        return children;
    }

    this.getSiblings = function() {
        /* Return siblings without the child itself
        var siblings = [];
        if (typeof this.parent != 'undefined') {
            for (n in this.parent.children) {
                if (this.parent.children[n] != this) {
                    siblings.push(this.parent.children[n]);
                }
            }            
        }
        return siblings;
        */
        return (this.parent != undefined) ? this.parent.children : null; // Return siblings along with the child itself (all children of the parent)
    }

    this.getPreviousSibling = function() {
        return (this.getSiblings().indexOf(this) - 1 >= 0) ? this.getSiblings()[this.getSiblings().indexOf(this) - 1] : this.getLastSibling();
    }

    this.getNextSibling = function() {
        return (this.getSiblings().indexOf(this) + 1 < this.getSiblings().length) ? this.getSiblings()[this.getSiblings().indexOf(this) + 1] : this.getFirstSibling();
    }

    this.getFirstSibling = function() {
        var siblings = this.getSiblings();
        var youngest = siblings[0];
        for (var i = siblings.length; i >= 0; i--) {
            if (i < this.getSiblings().indexOf(this)) {
                youngest = siblings[i];
            }
        }
        return youngest;
    }

    this.getLastSibling = function() {        
        var siblings = this.getSiblings();
        var oldest = siblings[0];
        for (i in siblings) {
            if (i > this.getSiblings().indexOf(this)) {
                oldest = siblings[i];
            }
        }
        return oldest;
    }

    this.hasChildren = function() {
        return (this.children.length > 0) ? true : false;
    }
}

var loadState = {
    preload: function() {
        var loadingLabel = game.add.text(80, 150, 'loading...', {font: '30px Courier', fill: '#ffffff'});

        game.load.json('settings', 'lib/settings.json');
        game.load.json('docks', 'lib/docks.json');
        game.load.json('missions', 'lib/missions.json');
        game.load.json('weapons', 'lib/weapons.json');
        game.load.json('shields', 'lib/shields.json');

        game.load.spritesheet('ship', 'img/ship.png', 51, 60);
        game.load.image('projectile', 'img/laser-blue-5.png');
        game.load.spritesheet('label', 'img/label-rockets.png', 75, 53);
        game.load.image('button', 'img/label-blue.png');
        game.load.image('star-blue', 'img/star-blue.png');
        game.load.image('star-red', 'img/star-red.png');
        game.load.image('planet-blue', 'img/planet-blue.png');
        game.load.image('planet-yellow', 'img/planet-yellow.png');
        game.load.image('planet-red', 'img/planet-red.png');
        game.load.image('galaxy-pink', 'img/galaxy-pink.png');
        game.load.image('galaxy-blue', 'img/galaxy-blue.png');
        game.load.image('galaxy-green', 'img/galaxy-green.png');

        //game.load.audio('sfx', ['aud/laser.mp3', 'aud/explosion.mp3']); // Try to load multiple assets into an array
        game.load.audio('sfx-laser', 'aud/laser.mp3');
        game.load.audio('sfx-explosion', 'aud/explosion.mp3');
        game.load.audio('music', 'aud/music.mp3');
    },

    create: function() {
        //game.cache.destroy();
        game.settings = game.cache.getJSON('settings');
        game.docks = game.cache.getJSON('docks');
        game.missions = game.cache.getJSON('missions');
        game.weapons = game.cache.getJSON('weapons');
        game.shields = game.cache.getJSON('shields');
        game.state.start('menu');
    }
};