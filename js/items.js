'use strict';

/*-----------------------------------------------------------------------
                                    Items
-----------------------------------------------------------------------*/

// Create an item
GameSystem.item = function(source, itemType, rarity) {
    var item;

    // If unspecified, get a random type
    var itemTemplate;
    var itemTypes = Object.keys(GameSystem.data.items);
    if (typeof itemType == "undefined") {
        var random = GameSystem.game.rnd.integerInRange(0, itemTypes.length - 1);
        itemTemplate = GameSystem.data.items[itemTypes[random]];
    } else {
        // Otherwise load type
        for (var i in itemTypes) {
            if (itemType == itemTypes[i]) {
                itemTemplate = GameSystem.data.items[itemTypes[i]];
            }
        }
    }
    // Get random preset
    var random = GameSystem.game.rnd.integerInRange(0, itemTemplate.presets.length - 1);
    item = JSON.parse(JSON.stringify(itemTemplate.presets[random]));

    item.level = source.level;

    // If unspecified, get a random faction
    var faction;
    if (typeof source.faction == "undefined") {
        var random = GameSystem.game.rnd.integerInRange(0, GameSystem.data.factions.length - 1);
        for (var i in GameSystem.data.factions) {
            if (random == i) {
                faction = GameSystem.data.factions[i];
            }
        }
    } else {
        // Otherwise load faction
        faction = source.faction;
    }

    // If unspecified, get a random rarity
    if (typeof rarity == "undefined") {
        var random = GameSystem.game.rnd.integerInRange(0, 100);
        for (var i in GameSystem.data.items.rarities) {
            if (random <= GameSystem.data.items.rarities[i].dropChance) {
                //console.log("Success! We rolled a " + random + " and we were looking for a " + GameSystem.data.items.rarities[i].dropChance + ", which means our item is " + GameSystem.data.items.rarities[i].name);
                rarity = GameSystem.data.items.rarities[i];
                break;
            }
        }
    } else {
        // Otherwise load rarity
        for (var i in GameSystem.data.items.rarities) {
            if (rarity == GameSystem.data.items.rarities[i]) {
                rarity = GameSystem.data.items.rarities[i];
            }
        }
    }

    // If we roll a bonus, choose a stat to boost
    rarity.statBonuses = [];
    var random = GameSystem.game.rnd.integerInRange(0, 100);    
    if (random < rarity.bonusChance) {
        var random = GameSystem.game.rnd.integerInRange(0, itemTemplate.bonusNames.length - 1);
        for (var i in itemTemplate.bonusNames) {
            if (random == i) {
                rarity.statBonuses.push(GameSystem.game.rnd.integerInRange(rarity.minStatBoost, rarity.maxStatBoost));
                rarity.bonusName = itemTemplate.bonusNames[i];
            } else {
                rarity.statBonuses.push(0);
            }
        }
    } else {
        // Otherwise set all stats to 0
        for (var i in itemTemplate.bonusNames) {
            rarity.statBonuses.push(0);
        }
    }

    // Set item tint color
    item.tintColor = faction.color;

    // Add faction bonus
    faction.statBonuses = [];
    for (var i in faction.bonuses) {
        if (itemType == i) {
            var counter = 0;
            for (var j in faction.bonuses[i]) {
                faction.statBonuses[counter] = faction.bonuses[i][j];
                counter++;
            }
        }
    }

    // Check if we have a special (add later)

    // Set item name
    var name = item.name;
    if (typeof rarity.bonusName == "undefined") {
        item.name = rarity.name + " " + item.name + " of " + faction.name;
    } else {
        item.name = rarity.name + " " + rarity.bonusName + " " + item.name + " of " + faction.name;
    }

    // Update item stats based on source level, rarity, bonus
    var statValue = 0;
    var counter = 0;
    for (var i in item.stats) {
        var statMultiplier = (GameSystem.game.rnd.integerInRange(rarity.minStatMultiplier, rarity.maxStatMultiplier) + 100) / 100;
        var oldStat = item.stats[i];
        item.stats[i] = Math.floor(item.stats[i] * statMultiplier + faction.statBonuses[counter] + rarity.statBonuses[counter] + item.level * GameSystem.data.items.levelMultiplier);
        statValue += item.stats[i] - oldStat;
        counter++;
    }

    // Update item value
    item.value = Math.floor(GameSystem.data.items.minValue + (item.level * GameSystem.data.items.minValue / 100) + (statValue * GameSystem.data.items.minValue / 100));

    return item;
}