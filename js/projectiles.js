'use strict';

/*-----------------------------------------------------------------------
                      Projectiles and Collisions
-----------------------------------------------------------------------*/

// Create a projectile
GameSystem.projectile = function(weapon, ship) {
    // Play the sound of the weapon firing
    var fireSound = GameSystem.game.add.audio(weapon.fireSound, GameSystem.data.settings.sfxVolume);
    fireSound.play();

    // Create the projectile
    var projectile;
    if (ship === GameSystem.playerSprite) {
        projectile = GameSystem.playerProjectiles.create(ship.x, ship.y, weapon.sprite);
    } else {
        projectile = GameSystem.enemyProjectiles.create(ship.x, ship.y, weapon.sprite);
    }
    
    // Set the angle
    projectile.angle = ship.angle;
    
    // Set the onwer so we don't register collisions with the shooter
    projectile.owner = ship;
    
    // Set projectile color based on faction
    var tintColor = "0x" + weapon.tintColor;
    projectile.tint = tintColor;

    // Create the object and enable physics
    GameSystem.game.physics.enable(projectile, GameSystem.game.Physics);
    //projectile.physics = GameSystem.game.Physics;
    projectile.anchor.setTo(0.5, 0.5);
    projectile.outOfBoundsKill = true;
    projectile.checkWorldBounds = true;

    // Set projectile attributes and stats
    projectile.fireSound = weapon.fireSound;
    projectile.impactSound = weapon.impactSound;
    projectile.weapon = weapon.type;

    for (var i in weapon.stats) {
        projectile[i] = weapon.stats[i];
    }

    // Normalize values that are based on screen size or time
    var height = GameSystem.game.world.height;

    projectile["Shield Damage"] = weapon.stats["Shield Damage"];
    projectile["Armor Damage"] = weapon.stats["Armor Damage"];
    projectile["Maximum Speed"] = GameSystem.normalize(weapon.stats["Projectile Speed"], GameSystem.data.settings.projectileSpeedLowerBound, GameSystem.data.settings.projectileSpeedUpperBound, 1, GameSystem.data.settings.statUpperBound);
    projectile.acceleration = GameSystem.normalize(weapon.stats.Acceleration, GameSystem.data.settings.projectileAccelerationLowerBound, GameSystem.data.settings.projectileAccelerationUpperBound, 1, GameSystem.data.settings.statUpperBound);

    // Remove magic number!!!
    projectile.size = GameSystem.normalize(weapon.stats["Projectile Size"], 0, 100, 0, GameSystem.data.settings.statUpperBound) * 0.05;

    projectile["Blast Radius"] = GameSystem.normalize(weapon.stats["Blast Radius"], GameSystem.data.settings.blastRadiusLowerBound, GameSystem.data.settings.blastRadiusUpperBound, 1, GameSystem.data.settings.statUpperBound);
    
    // Set projectile size based on ship size and weapon stat
    projectile.scale.setTo(projectile.size, projectile.size);

    // Give the projectile a starting velocity (probably not useful unless acceleration system is changed)
    //projectile.body.velocity.y = -projectile.maxSpeed;
    return projectile;
}

// Create an explosion
GameSystem.explode = function(source) {
    var front = GameSystem.getFront(source);
    var explosion = GameSystem.explosions.create(front.x, front.y, "star-red");
    explosion.tint = source.tint;
    explosion.owner = source.owner || source;
    explosion["Shield Damage"] = source["Shield Damage"] || 0;
    explosion["Armor Damage"] = source["Armor Damage"] || 0;
    
    // Set explosion size based on projectile or ship
    if (source["Blast Radius"] != "undefined") {
        explosion.scale.setTo(source["Blast Radius"], source["Blast Radius"]);
    } else {
        explosion.scale.setTo(source.scale.x, source.scale.y);
    }
    
    // Enable physics
    GameSystem.game.physics.enable(explosion, GameSystem.game.Physics);
    explosion.outOfBoundsKill = true;
    explosion.checkWorldBounds = true;
    explosion.anchor.setTo(0.5, 0.5);

    // Set duration of explosion
    explosion.lifespan = 50;

    // Kill the projectile
    source.kill();
}

// Update projectile movement, check for collisions, etc.
GameSystem.updateProjectiles = function() {
    // First check if we've reached max distance or duration, that way we kill the projectile as soon as possible
    // Apparently Phaser sprites have a timer we can use to kill projectiles and stuff
    GameSystem.playerProjectiles.forEachExists(GameSystem.checkProjectileDuration, this);
    GameSystem.playerProjectiles.forEachExists(GameSystem.checkProjectileDistance, this);
    GameSystem.enemyProjectiles.forEachExists(GameSystem.checkProjectileDuration, this);
    GameSystem.enemyProjectiles.forEachExists(GameSystem.checkProjectileDistance, this);

    // Update projectile movement, animations, etc.
    GameSystem.playerProjectiles.forEachExists(GameSystem.checkProjectileSpeed, this);
    GameSystem.enemyProjectiles.forEachExists(GameSystem.checkProjectileSpeed, this);
}

GameSystem.checkProjectileSpeed = function(projectile) {
    // Get current projectile speed
    var speed = Math.abs(Math.pow(projectile.body.velocity.x, 2) + Math.pow(projectile.body.velocity.y, 2));

    // Check if the projectile has reached maximum speed
    if (speed < projectile["Maximum Speed"]) {
        // If it hasn't reached maximum speed, then get the x and y acceleration
        var xAcceleration = Math.cos(projectile.rotation) * projectile["Acceleration"];
        var yAcceleration = Math.sin(projectile.rotation) * projectile["Acceleration"];

        var newSpeed = Math.abs(Math.pow(projectile.body.velocity.x + xAcceleration, 2) + Math.pow(projectile.body.velocity.y + yAcceleration, 2));

        // If we accelerate past maximum speed
        if (newSpeed > projectile["Maximum Speed"]) {
            // Set speed to maximum
            projectile.body.velocity.x = Math.cos(projectile.rotation - (90 * Math.PI / 180)) * projectile["Maximum Speed"];
            projectile.body.velocity.y = Math.sin(projectile.rotation - (90 * Math.PI / 180)) * projectile["Maximum Speed"];
        } else {
            projectile.body.velocity.x = Math.cos(projectile.rotation - (90 * Math.PI / 180)) * newSpeed;
            projectile.body.velocity.y = Math.sin(projectile.rotation - (90 * Math.PI / 180)) * newSpeed;
        }
    }
}

// Check if the projectile's timer has expired
GameSystem.checkProjectileDuration = function(projectile) {
    
}

// Check if the projectile has traveled its maximum distance
GameSystem.checkProjectileDistance = function(projectile) {

}

GameSystem.checkProjectileReady = function(weapon) {
    // If the weapon timer has expired or we haven't fired yet
    if (GameSystem.game.time.now > weapon.time || typeof weapon.time == "undefined") {
        // Set the timer and give the go-ahead to fire
        var delay = GameSystem.normalize(GameSystem.data.settings.statUpperBound - weapon.stats["Rate of Fire"], 35, 750, 1, GameSystem.data.settings.statUpperBound);
        weapon.time = GameSystem.game.time.now + delay;
        return true;
    }
    // Otherwise don't fire
    return false;
}

GameSystem.enemyExplosionCollisionHandler = function(explosion, target) {

}

// Handle projectile collisions with enemies
GameSystem.enemyCollisionHandler = function(projectile, target) {
    // Check if we're colliding with the shooter
    if (projectile.owner == target) {
        //console.log("Projectile hit owner");
    } else {
        //console.log("Projectile hit target");
        GameSystem.explode(projectile);
        target.destroy();
        //GameSystem.game.add.tween(target).to( { alpha: 0 }, 100, Phaser.Easing.Linear.None, true);
    }
}

GameSystem.playerExplosionCollisionHandler = function(explosion, target) {

}

// Handle projectile collision with player
GameSystem.playerCollisionHandler = function(player, projectile) {
    // Check if we're colliding with the shooter
    if (projectile.owner == player) {
        //console.log("Projectile hit owner");
    } else {
        GameSystem.explode(projectile);
    }
}

// Get the front and center point of the sprite
GameSystem.getFront = function(sprite) {
    var x = sprite.x + Math.cos(sprite.rotation - (90 * Math.PI / 180)) * sprite.width / 2;
    var y = sprite.y + Math.sin(sprite.rotation - (90 * Math.PI / 180)) * sprite.height / 2;
    var front = new Phaser.Point(x, y);
    return front;
}