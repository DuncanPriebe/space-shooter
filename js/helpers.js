'use strict';

/*-----------------------------------------------------------------------
                        Misc. Helper Functions
-----------------------------------------------------------------------*/

// Normalize values into game bounds
GameSystem.normalize = function(value, lowerBound, upperBound, minValue, maxValue) {
    // If we aren't given values, normalize between 0 and 100
    minValue = (minValue) ? minValue : 0;
    maxValue = (maxValue) ? maxValue : 100;
    return lowerBound + ((value - minValue) * (upperBound - lowerBound) / (maxValue - minValue));
}

// Return the vector based on speed and angle
GameSystem.vector = function(velocityX, velocityY, angle) {
    this.direction = Math.atan2(velocityY, velocityX) * 180 / Math.PI;
    this.magnitude = Math.sqrt((Math.pow(velocityX, 2) + Math.pow(velocityY, 2)));
}

// Convert a value to money
GameSystem.monify = function(n, c, d, t) {
    var c = isNaN(c = Math.abs(c)) ? 0 : c,
        d = d == undefined ? "" : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "", 
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
}

// Copy an object
GameSystem.clone = function (original, context, key) {
    for (key in context)
        if (context.hasOwnProperty(key))
            if (Object.prototype.toString.call(context[key]) === '[object Object]')
                original[key] = GameSystem.clone(original[key] || {}, context[key]);
            else
                original[key] = context[key];
    return original;
};