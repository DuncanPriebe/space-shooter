'use strict';

/*-----------------------------------------------------------------------
                            Docks and Vendors
-----------------------------------------------------------------------*/

// Create a vendor
GameSystem.vendor = function(world, itemType) {
    var vendor = {};
    vendor.faction = world.faction;
    vendor.level = world.level;
    vendor.type = itemType;

    // Choose a name at random
    var random = GameSystem.game.rnd.integerInRange(0, vendor.faction.firstNames.length - 1);
    var firstName = vendor.faction.firstNames[random];
    random = GameSystem.game.rnd.integerInRange(0, vendor.faction.lastNames.length - 1);
    var lastName = vendor.faction.lastNames[random];

    vendor.name = firstName + " " + lastName;

    vendor.items = [];
    for (var i = 0; i < 5; i++) {
        vendor.items.push(new GameSystem.item(vendor, vendor.type));
    }
    return vendor;
}