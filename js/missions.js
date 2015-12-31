'use strict';

/*-----------------------------------------------------------------------
                      Worlds, Factions and Missions
-----------------------------------------------------------------------*/

// Create a world
GameSystem.world = function(index) {
    var world = JSON.parse(JSON.stringify(GameSystem.data.worlds[index]));
    world.index = index;
    world.faction = GameSystem.faction(world.faction);
    return world;  
}

// Get a faction based on name
GameSystem.faction = function(name, set) {
    // Check if we have specified the set of faction names to choose from
    if (typeof set == "undefined") {
        set = [];
        for (var i in GameSystem.data.factions) {
            set.push(GameSystem.data.factions[i].key);
        }
    }

    // If we wanted a random faction, pick a random name from the set and call the function
    if (typeof name == "undefined" || name == "random") {
        var random = GameSystem.game.rnd.integerInRange(0, set.length - 1);
        //return GameSystem.faction(set[random], set);
        name = set[random];
    }

    // Get the faction and return it
    for (var i in GameSystem.data.factions) {
        if (name == GameSystem.data.factions[i].key) {
            return GameSystem.data.factions[i];
        }
    }
}

// Create a mission
GameSystem.mission = function(world, randomFlag) {
    var mission = {};
    var missionPreset;

    // We're loading the mission from the world data
    if (!randomFlag) {
        mission = JSON.parse(JSON.stringify(world.mission));
        mission.level = world.level;
        mission.faction = world.faction;
        for (var i in GameSystem.data.missions.presets) {
            if (mission.preset == GameSystem.data.missions.presets[i].name) {
                missionPreset = GameSystem.data.missions.presets[i];
                break;
            }
        }
    } else {
        // Choose a mission type at random
        mission.level = world.level;
        mission.faction = world.faction;
        var random = GameSystem.game.rnd.integerInRange(0, GameSystem.data.missions.presets.length - 1);
        missionPreset = GameSystem.data.missions.presets[random];
    }
    
    // Check what type of mission we're playing and load settings
    switch (missionPreset.name) {
        case "killEnemies":
            mission.checkEnemiesSpawned = false;
            mission.checkEnemiesKilled = true;
            mission.checkBossesKilled = false;
            mission.checkDuration = false;
            mission.checkAlliesKilled = false;
            break;
        case "killBosses":
            mission.checkEnemiesSpawned = false;
            mission.checkEnemiesKilled = false;
            mission.checkBossesKilled = true;
            mission.checkDuration = false;
            mission.checkAlliesKilled = false;
            break;
        case "surviveEnemies":
            mission.checkEnemyCount = false;
            mission.checkEnemiesKilled = false;
            mission.checkBossesKilled = false;
            mission.checkDuration = true;
            mission.checkAlliesKilled = false;
            break;
        case "surviveDuration":
            mission.checkEnemyCount = false;
            mission.checkEnemiesKilled = false;
            mission.checkBossesKilled = false;
            mission.checkDuration = true;
            mission.checkAlliesKilled = false;
            break;
        case "escort":
            mission.checkEnemyCount = true;
            mission.checkEnemiesKilled = false;
            mission.checkBossesKilled = false;
            mission.checkDuration = true;
            mission.checkAlliesKilled = true;
            break;
        case "rescue":
            mission.checkEnemyCount = true;
            mission.checkEnemiesKilled = false;
            mission.checkBossesKilled = false;
            mission.checkDuration = false;
            mission.checkAlliesKilled = true;
            break;
    }

    // Set the index to the first enemy
    mission.enemiesSpawned = 0;
    mission.enemiesKilled = 0;
    mission.bossesSpawned = 0;
    mission.bossesKilled = 0;

    // Set stats based on mission type
    mission.enemiesRemaning = GameSystem.game.rnd.integerInRange(missionPreset.minEnemyCount, missionPreset.enemyCountMultiplier * mission.level);
    mission.maxEnemyDelay = missionPreset.maxEnemyDelay * 1000;
    mission.minEnemyDelay = mission.maxEnemyDelay - missionPreset.enemyDelayMultiplier * mission.level * 1000;
    mission.bossesRemaining = GameSystem.game.rnd.integerInRange(missionPreset.minBossCount, missionPreset.bossCountMultiplier * mission.level);
    mission.duration = GameSystem.game.rnd.integerInRange(missionPreset.minDuration, missionPreset.durationMultiplier * mission.level);

    // Set mission Name
    if (typeof mission.name == "undefined") {
        mission.name = missionPreset.prefix + " " + mission.faction.name + " " + missionPreset.suffix;
    }

    // Set mission timer
    mission.time = GameSystem.game.time.now + mission.duration * 1000;

    // Set cluster flag and delay
    mission.clusterFlag = false;
    mission.clusterTime = 0;
    mission.clusterEnemiesRemaining = 0;
    mission.clusterEnemyPreset;
    mission.clusterSpawnX = -1; // Set to negative one so that we know to reset it

    // Set first enemy delay
    mission.enemyTime = GameSystem.game.time.now + mission.maxEnemyDelay;
    
    return mission;
}