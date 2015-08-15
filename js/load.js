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

var loadState = {
    preload: function() {
        var loadingLabel = game.add.text(80, 150, 'loading...', {font: '30px Courier', fill: '#ffffff'});

        game.load.json('settings', 'lib/settings.json');
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
        game.missions = game.cache.getJSON('missions');
        game.weapons = game.cache.getJSON('weapons');
        game.shields = game.cache.getJSON('shields');
        game.state.start('menu');
    }
};