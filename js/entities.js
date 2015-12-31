'use strict';

/*-----------------------------------------------------------------------
                          Sprites and Ships
-----------------------------------------------------------------------*/

// Create an entity with weapons, shield, etc.
GameSystem.entity = function(source, rarity) {
    this.primaryWeapons = [];
    this.secondaryWeapons = [];
    this.modules = [];
    this.ship = new GameSystem.item(source, "ships", rarity);
    for (var i = 0; i < this.ship.primaryWeaponSlots; i++) {
        this.primaryWeapons.push(GameSystem.item(source, "weapons", rarity));
    }
    for (var i  = 0; i < this.ship.secondaryWeaponSlots; i++) {
        this.secondaryWeapons.push(GameSystem.item(source, "weapons", rarity));
    }
    this.shield = new GameSystem.item(source, "shields", rarity);
    this.engine = new GameSystem.item(source, "engines", rarity);
    this.generator = new GameSystem.item(source, "generators", rarity);
    for (var i = 0; i < this.ship.moduleSlots; i++) {
        this.modules.push(new GameSystem.item(source, "modules", rarity));
    }
}

// Fire primary weapons
GameSystem.entity.prototype.firePrimary = function(sprite) {
    // First check if we've fired secondary weapons recently
    if (typeof this.weaponSecondaryTime == "undefined" || GameSystem.game.time.now > this.weaponSecondaryTime) {
        // Attempt to fire all primary weapons
        for (var i in this.primaryWeapons) {
            if (GameSystem.checkProjectileReady(this.primaryWeapons[i])) {
                GameSystem.projectile(this.primaryWeapons[i], sprite);
            }
        }
        this.weaponPrimaryTime = GameSystem.game.time.now + GameSystem.data.settings.firingDelay;
    }
}

// Fire secondary weapons
GameSystem.entity.prototype.fireSecondary = function(sprite) {
    // First check if we've fired secondary weapons recently
    if (typeof this.weaponPrimaryTime == "undefined" || GameSystem.game.time.now > this.weaponPrimaryTime) {
        // Attempt to fire all secondary weapons
        for (var i in this.secondaryWeapons) {
            if (GameSystem.checkProjectileReady(this.secondaryWeapons[i])) {
                GameSystem.projectile(this.secondaryWeapons[i], sprite);
            }
        }
        this.weaponSecondaryTime = GameSystem.game.time.now + GameSystem.data.settings.firingDelay;
    }
}

// Move a ship
GameSystem.entity.prototype.move = function(sprite, direction) {
    // Set movement information based on engine stats
    sprite["Maximum Vertical Speed"] = GameSystem.normalize(this.engine.stats["Maximum Vertical Speed"], GameSystem.data.settings.engineSpeedLowerBound, GameSystem.data.settings.engineSpeedUpperBound, 1, GameSystem.data.settings.statUpperBound);
    sprite["Vertical Acceleration"] = GameSystem.normalize(this.engine.stats["Vertical Acceleration"], GameSystem.data.settings.engineAccelerationLowerBound, GameSystem.data.settings.engineAccelerationUpperBound, 1, GameSystem.data.settings.statUpperBound);
    sprite["Maximum Horizontal Speed"] = GameSystem.normalize(this.engine.stats["Maximum Horizontal Speed"], GameSystem.data.settings.engineSpeedLowerBound, GameSystem.data.settings.engineSpeedUpperBound, 1, GameSystem.data.settings.statUpperBound);
    sprite["Horizontal Acceleration"] = GameSystem.normalize(this.engine.stats["Horizontal Acceleration"], GameSystem.data.settings.engineAccelerationLowerBound, GameSystem.data.settings.engineAccelerationUpperBound, 1, GameSystem.data.settings.statUpperBound);

    // Check what direction we're moving
    switch (direction) {
        case "forward":
            // Existing x and y velocities
            var oldSpeedX = sprite.body.velocity.x;
            var oldSpeedY = sprite.body.velocity.y;

            // New x and y velocities after being accelerated according to angle of sprite
            var newSpeedX = sprite.body.velocity.x + Math.cos(sprite.rotation - 90 * Math.PI / 180) * sprite["Vertical Acceleration"];
            var newSpeedY = sprite.body.velocity.y + Math.sin(sprite.rotation - 90 * Math.PI / 180) * sprite["Vertical Acceleration"];

            //var newSpeed = Math.sqrt((Math.pow(newSpeedX, 2) + Math.pow(newSpeedY, 2)));
            //console.log("Moving: " + direction + ", Velocity: " + newSpeedX + ", " + newSpeedY + ", NewSpeed: " + newSpeed);

            sprite.body.velocity.x = newSpeedX;
            sprite.body.velocity.y = newSpeedY;


            break;
        case "backward":
            var newSpeedX = sprite.body.velocity.x + Math.cos(sprite.rotation + 90 * Math.PI / 180) * sprite["Vertical Acceleration"];
            var newSpeedY = sprite.body.velocity.y + Math.sin(sprite.rotation + 90 * Math.PI / 180) * sprite["Vertical Acceleration"];

            //var newSpeed = Math.sqrt((Math.pow(newSpeedX, 2) + Math.pow(newSpeedY, 2)));
            //console.log("Moving: " + direction + ", Velocity: " + newSpeedX + ", " + newSpeedY + ", NewSpeed: " + newSpeed);
            
            sprite.body.velocity.x = newSpeedX;
            sprite.body.velocity.y = newSpeedY;
            break;
        case "stopVertical":
            if (sprite.body.velocity.y > 0) {
                var newSpeed = sprite.body.velocity.y + -sprite["Vertical Acceleration"] * GameSystem.data.settings.brakeRatio;
                if (newSpeed < 0) {
                    newSpeed = 0;
                }
                sprite.body.velocity.y = newSpeed;
            } else if (sprite.body.velocity.y < 0) {
                var newSpeed = sprite.body.velocity.y + sprite["Vertical Acceleration"] * GameSystem.data.settings.brakeRatio;
                if (newSpeed > 0) {
                    newSpeed = 0;
                }
                sprite.body.velocity.y = newSpeed;
            }
            break;
        case "left":
            var newSpeedX = sprite.body.velocity.x + Math.cos(sprite.rotation - 180 * Math.PI / 180) * sprite["Horizontal Acceleration"];
            var newSpeedY = sprite.body.velocity.y + Math.sin(sprite.rotation - 180 * Math.PI / 180) * sprite["Horizontal Acceleration"];

            //var newSpeed = Math.sqrt((Math.pow(newSpeedX, 2) + Math.pow(newSpeedY, 2)));
            //console.log("Moving: " + direction + ", Velocity: " + newSpeedX + ", " + newSpeedY + ", NewSpeed: " + newSpeed);
            
            sprite.body.velocity.x = newSpeedX;
            sprite.body.velocity.y = newSpeedY;
            break;
        case "right":
            var newSpeedY = sprite.body.velocity.y + Math.sin(sprite.rotation + 0 * Math.PI / 180) * sprite["Horizontal Acceleration"];
            var newSpeedX = sprite.body.velocity.x + Math.cos(sprite.rotation + 0 * Math.PI / 180) * sprite["Horizontal Acceleration"];

            //var newSpeed = Math.sqrt((Math.pow(newSpeedX, 2) + Math.pow(newSpeedY, 2)));
            //console.log("Moving: " + direction + ", Velocity: " + newSpeedX + ", " + newSpeedY + ", NewSpeed: " + newSpeed);
            
            sprite.body.velocity.x = newSpeedX;
            sprite.body.velocity.y = newSpeedY;
            break;
        case "stopHorizontal":
            if (sprite.body.velocity.x > 0) {
                var newSpeed = sprite.body.velocity.x + -sprite["Horizontal Acceleration"] * GameSystem.data.settings.brakeRatio;
                if (newSpeed < 0) {
                    newSpeed = 0;
                }
                sprite.body.velocity.x = newSpeed;
            } else if (sprite.body.velocity.x < 0) {
                var newSpeed = sprite.body.velocity.x + sprite["Horizontal Acceleration"] * GameSystem.data.settings.brakeRatio;
                if (newSpeed > 0) {
                    newSpeed = 0;
                }
                sprite.body.velocity.x = newSpeed;
            }
            break;
    }
}