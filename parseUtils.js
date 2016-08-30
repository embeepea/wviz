var THREE = require('./libs/threejs/three.js');
var sprintf = require('sprintf');

module.exports = {

    parseMatrix4: function(str) {
        if (typeof(str) === "string") {
            var m = new THREE.Matrix4();
            var e = str.split(/,/).map(function(s) { return parseFloat(s); });
            m.set(e[0], e[1], e[2], e[3],
                  e[4], e[5], e[6], e[7],
                  e[8], e[9], e[10], e[11],
                  e[12], e[13], e[14], e[15]);
            return m;
        } else {
            return str;
        }
    },

    matrix4ToString: function(m) {
        var e = m.elements;
        return sprintf("%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f",
                       e[0],e[4],e[ 8],e[12],
                       e[1],e[5],e[ 9],e[13],
                       e[2],e[6],e[10],e[14],
                       e[3],e[7],e[11],e[15]);
    },

    parseBoolean: function(v) {
        return (v !== false
                &&
                v !== "0"
                &&
                v !== 0);
    },

    booleanToString: function(v) {
        return v ? "1" : "0";
    },

    parseFloatArray: function(str) {
        if (typeof(str) === "string") {
            return str.split(/,/).map(function(s) { return parseFloat(s); });
        } else {
            return str;
        }
    },

    floatArrayToString: function(a) {
        return a.map(function(x) { return sprintf("%.4f", x); }).join(",");
    },

    parseIntArray: function(str) {
        if (typeof(str) === "string") {
            return str.split(/,/).map(function(s) { return parseInt(s,10); });
        } else {
            return str;
        }
    },

    intArrayToString: function(a) {
        return a.map(function(x) { return sprintf("%1d", x); }).join(",");
    },

    parseIInt: function(str) {
        if (typeof(str) === "string") { return parseInt(str,10); }
        return str;
    },

    intToString: function(a) { return sprintf("%1d", a); },

    parseFFloat: function(str) {
        if (typeof(str) === "string") { return parseFloat(str); }
        return str;
    },

    floatToString: function(a) { return sprintf("%.4f", a); },

    parseDragMode: function(str) {
        if (str === "t" || str === "translate") { return "translate"; }
        return "rotate";
    },

    dragModeToString: function(m) {
        if (m === "translate" || m === "t") { return "t"; }
        return "r";
    },

    parseScaleTarget: function(str) {
        if (str === "d" || str === "drop") { return "drop"; }
        return "world";
    },

    scaleTargetToString: function(m) {
        if (m === "drop" || m === "d") { return "d"; }
        return "w";
    }

};
