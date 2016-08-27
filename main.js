require('./style.css');
var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var EventTracker = require('./EventTracker.js');
var terrain = require('./terrain.js');
var rain = require('./rain.js');
var URL = require('./url.js');
var kbd_processor = require('./kbd_processor.js');
var wviz = require('./wviz.js');

var width, height, canvas;
var permalink = null;

window.debug = require('./debug.js');

function parseMatrix4(str) {
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
}

function matrix4ToString(m) {
    var e = m.elements;
    return sprintf("%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f",
                   e[0],e[4],e[ 8],e[12],
                   e[1],e[5],e[ 9],e[13],
                   e[2],e[6],e[10],e[14],
                   e[3],e[7],e[11],e[15]);
}

function parseBoolean(v) {
    return (v !== false
            &&
            v !== "0"
            &&
            v !== 0);
}

function booleanToString(v) {
    return v ? "1" : "0";
}

function parseFloatArray(str) {
    if (typeof(str) === "string") {
        return str.split(/,/).map(function(s) { return parseFloat(s); });
    } else {
        return str;
    }
}

function floatArrayToString(a) {
    return a.map(function(x) { return sprintf("%.4f", x); }).join(",");
}

function parseIntArray(str) {
    if (typeof(str) === "string") {
        return str.split(/,/).map(function(s) { return parseInt(s,10); });
    } else {
        return str;
    }
}

function intArrayToString(a) {
    return a.map(function(x) { return sprintf("%1d", x); }).join(",");
}

function parseIInt(str) {
    if (typeof(str) === "string") { return parseInt(str,10); }
    return str;
}

function intToString(a) { return sprintf("%1d", a); }

function parseDragMode(str) {
    if (str === "t" || str === "translate") { return "translate"; }
    return "rotate";
}

function dragModeToString(m) {
    if (m === "translate" || m === "t") { return "t"; }
    return "r";
}

var commands = [
    {
        seq: "ae",
        action: function toggleEdges() {
            wviz.setEdges(!wviz.edges.visible);
            permalink.set("edges", wviz.edges.visible);
            updatePermalink();
            wviz.requestRender();
        },
        msgfunc: function() { return "edges " + (wviz.edges.visible ? "on" : "off"); },
        permalink: {
            key: "edges",
            urlKey: "ae",
            default: null,
            parse: parseBoolean,
            toString: booleanToString,
            setState: wviz.setEdges
        }
    },
    {
        seq: "af",
        action: function toggleFaces() {
            wviz.setFaces(!wviz.faces.visible);
            permalink.set("faces", wviz.faces.visible);
            updatePermalink();
            wviz.requestRender();
        },
        msgfunc: function() { return "faces " + (wviz.faces.visible ? "on" : "off"); },
        permalink: {
            key: "faces",
            urlKey: "af",
            default: null,
            parse: parseBoolean,
            toString: booleanToString,
            setState: wviz.setFaces
        }
    },
    {
        seq: "ac",
        action: function toggleAxes() {
            wviz.setAxes(!wviz.axes.visible);
            permalink.set("axes", wviz.axes.visible);
            updatePermalink();
            wviz.requestRender();
        },
        msgfunc: function() { return "axes " + (wviz.axes.visible ? "on" : "off"); },
        permalink: {
            key: "axes",
            urlKey: "ac",
            default: null,
            parse: parseBoolean,
            toString: booleanToString,
            setState: wviz.setAxes
        }
    },
    {
        seq: "al",
        action: function toggleLattice() {
            wviz.setLattice(!wviz.lattice.visible);
            permalink.set("lattice", wviz.lattice.visible);
            updatePermalink();
            wviz.requestRender();
        },
        msgfunc: function() { return "lattice " + (wviz.lattice.visible ? "on" : "off"); },
        permalink: {
            key: "lattice",
            urlKey: "al",
            default: null,
            parse: parseBoolean,
            toString: booleanToString,
            setState: wviz.setLattice
        }
    },
    {
        //seq: undefined // no kbd seq for this one
        permalink: {
            key: "ij",
            urlKey: "ij",
            default: null,
            parse: parseIntArray,
            toString: intArrayToString,
            setState: wviz.setIJ
        }
    },
    {
        //seq: undefined // no kbd seq for this one
        permalink: {
            key: "mm",
            urlKey: "mm",
            default: null,
            parse: parseMatrix4,
            toString: matrix4ToString,
            setState: function(m) {
                if (m) {
                    wviz.world.matrix.copy(m);
                    wviz.world.matrixWorldNeedsUpdate = true;
                }
            }
        }
    },

    {
        //seq: undefined // no kbd seq for this one
        permalink: {
            key: "center",
            urlKey: "c",
            default: null,
            parse: parseFloatArray,
            toString :floatArrayToString,
            //setState: function(c) { wviz.setCenter(c); } // using anon fn because wviz.setCenter not defined til later
            setState: function(c) {
                if (c) {
                    wviz.axes.position.set(c[0], c[1], c[2]);
                }
            }
        }
    },

    {
        seq: "aw",
        action: function lineWidth(a) {
            if (a) {
                wviz.setLineWidth(a);
                permalink.set("lineWidth", a);
                updatePermalink();
                wviz.requestRender();
            }
        },
        msgfunc: function() { return sprintf("line width = %1d", wviz.edges.material.linewidth); },
        permalink: {
            key: "lineWidth",
            urlKey: "aw",
            default: null,
            parse: parseIInt,
            toString: intToString,
            setState: wviz.setLineWidth
        }
    },

    {
        seq: "t",
        action: function() {
            wviz.mouseDragMode = "translate";
            permalink.set("dragMode", "translate");
            updatePermalink();
        },
        msgfunc: function() { return "translate"; },
        permalink: {
            key: "dragMode",
            urlKey: "dm",
            default: null,
            parse: parseDragMode,
            toString: dragModeToString,
            setState: function(m) {
                wviz.mouseDragMode = parseDragMode(m);
            }
        }
    },
    {
        seq: "r",
        action: function() {
            wviz.mouseDragMode = "rotate";
            permalink.set("dragMode", "rotate");
            updatePermalink();
        },
        msgfunc: function() { return "rotate"; },
        permalink: {
            key: "dragMode",
            urlKey: "dm",
            default: null,
            parse: parseDragMode,
            toString: dragModeToString,
            setState: function(m) {
                wviz.mouseDragMode = parseDragMode(m);
            }
        }
    },

    { seq: "fs",
      action: function(a) {
          if (a) {
              wviz.setFallSpeed(a);
              permalink.set("fallSpeed", a);
              updatePermalink();
          }
      },
      msgfunc: function(n) { return sprintf("speed set to %1d", n); },
      permalink: {
            key: "fallSpeed",
            urlKey: "fs",
            default: null,
            parse: parseIInt,
            toString: intToString,
            setState: function(a) {
                wviz.setFallSpeed(a);
            }
      }
    },

    { seq: " ",
      action: wviz.advanceOnce,
      msgfunc: function() { return "advance once"; } },
    { seq: ".",
      action: wviz.advanceAll,
      msgfunc: function() { return "advance all"; } },
    { seq: "n",
      action: wviz.toggleNeighbors,
      msgfunc: function() { return "toggle neighbor points"; } },
    { seq: "h",
      action: wviz.toggleHeightLines,
      msgfunc: function() { return "toggle height lines"; } },
    { seq: "x",
      action: wviz.toggleText,
      msgfunc: function() { return "toggle text"; } },
    { seq: "ds",
      action: wviz.toggleDropScale,
      msgfunc: function() { return "toggle drop scale"; } },
    { seq: "br",
      action: function() { rain.beginRain(wviz.settings, state, wviz.settings.drop.fallSpeed, wviz.requestRender); },
      msgfunc: function() { return "begin rain"; } },
    { seq: "er",
      action: function() { rain.endRain(state, wviz.requestRender); },
      msgfunc: function() { return "end rain"; } }
];

// A utility object for constructing and extracting information from the
// application URL:
function Permalink(url, commands) {
    var pl = {
        toString : function() { return url.toString(); }
    };
    var vals = {};
    pl.have = function(k) {
        return (k in vals && vals[k].key !== vals[k].default);
    };
    pl.get = function(k) {
        if (!(k in vals)) { return undefined; }
        return vals[k].val;
    };
    pl.set = function(k,v) {
        vals[k].val = vals[k].parse(v);
        url.params[vals[k].urlKey] = vals[k].toString(vals[k].val);
    };
    commands.forEach(function(cmd) {
        if (cmd.permalink) {
            vals[cmd.permalink.key] = cmd.permalink;
            vals[cmd.permalink.key].val = cmd.permalink.default;
            if (cmd.permalink.urlKey in url.params) {
                vals[cmd.permalink.key].val = cmd.permalink.parse(url.params[cmd.permalink.urlKey]);
            }
            if (cmd.permalink.setState) {
                if (pl.have(cmd.permalink.key)) {
                    cmd.permalink.setState(pl.get(cmd.permalink.key));
                }
            }
        }
    });
    return pl;
}

function displayMessage(msg) {
    if (msg==="" || typeof(msg)==="undefined") {
        hideMessage();
    } else {
        $('#message').attr("style","");
        $('#message').removeClass("display-none");
        $('#message').addClass("display-block");
        $('#message').html(msg);
    }
}

function hideMessage() {
    $('#message').attr("style","");
    $('#message').removeClass("display-block");
    $('#message').addClass("display-none");
    $('#message').html("");
}

function fadeMessage(msg) {
    $('#message').fadeOut(1000, function() {
        $('#message').removeClass("display-block");
        $('#message').addClass("display-none");
    });
}

function updatePermalink() {
    window.history.replaceState({}, "", permalink.toString());
}

wviz.addListener("ijset", function(e) {
    if (permalink) {
        permalink.set("ij", e.ij);
        updatePermalink();
    }
});

var kp = kbd_processor(commands,
                       function(msg) {
                           displayMessage(msg);
                       },
                       function(msg) {
                           displayMessage(msg);
                           fadeMessage();
                       });


wviz.addListener("launched", function(e) {
    permalink = Permalink(URL({url: window.location.toString()}), commands);
    var moving = wviz.world;
    var center = wviz.axes;
    var frame  = wviz.camera;
    var eventTracker = EventTracker.eventTracker(canvas, {
        mouseDown: function(p) {
        },
        mouseDrag: function(p, dp, button) {
            // Note: the axis of rotation for a mouse displacement of (dp.x,dp.y) would
            // normally be (-dp.y, dp.x, 0), but since the y direction of screen coords
            // is reversed (increasing towards the bottom of the screen), we need to negate
            // the y coord here; therefore we use (dp.y, dp.x, 0):
            var v, d, angle, L=null;
            if (wviz.mouseDragMode === "rotate") {
                if (button === 0) {
                    v = new THREE.Vector3(dp.y, dp.x, 0).normalize();
                    d = Math.sqrt(dp.x*dp.x + dp.y*dp.y);
                    angle = (d / canvas.width) * Math.PI;
                    L = new THREE.Matrix4().makeRotationAxis(v, angle);
                } else if (button === 1) {
                    v = new THREE.Vector3(dp.y, dp.x, 0).normalize();
                    d = Math.sqrt(dp.x*dp.x + dp.y*dp.y);
                    angle = (d / canvas.width) * Math.PI;
                    if (dp.x - dp.y < 0) { angle = -angle; }
                    L = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), angle);
                }
            } else if (wviz.mouseDragMode === "translate") {
                L = new THREE.Matrix4().makeTranslation(dp.x/25, -dp.y/25, 0);
            }
            if (L) {
                var M = EventTracker.computeTransform(moving,center,frame, L);
                moving.matrix.multiplyMatrices(moving.matrix, M);
                if (permalink) {
                    permalink.set("mm", moving.matrix);
                    updatePermalink();
                }
                moving.matrixWorldNeedsUpdate = true;
                wviz.requestRender();
            }
        },
        mouseUp: function(p, t, d, event) {
            if (t < 150) {
                if (event.shiftKey && event.button === 0) {
                    // shift-left-click event
                    wviz.pick(p.x, p.y, function(x,y,z) {
                        var ij = wviz.m.xy_to_ij([x,y]);
                        wviz.drop.moveToIJ(ij[0], ij[1]);
                        wviz.requestRender();
                    });
                }
                if (event.ctrlKey && event.button === 0) {
                    // ctrl-left-click event
                    wviz.pick(p.x, p.y, function(x,y,z) {
                        wviz.setCenter([x,y,z]);
                        if (permalink) {
                            permalink.set("center", [x,y,z]);
                            updatePermalink();
                        }
                        wviz.requestRender();
                    });
                }
            }
        },
        mouseWheel: function(delta) {
            var s;
            if (wviz.mouseWheelMode === "scale") {
                s = Math.exp(delta/20.0);
                var R = new THREE.Matrix4().makeScale(s,s,s);
                var M = EventTracker.computeTransform(moving,center,frame, R);
                moving.matrix.multiplyMatrices(moving.matrix, M);
                if (permalink) {
                    permalink.set("mm", moving.matrix);
                    updatePermalink();
                }
                moving.matrixWorldNeedsUpdate = true;
                wviz.requestRender();
            } else if (wviz.mouseWheelMode === "dropScale") {
                s = Math.exp(delta/20.0);
                wviz.settings.drop.radius *= s;
                wviz.drop.setRadius(wviz.settings.drop.radius);
                wviz.requestRender();
            }
        },
        keyPress: function(event) {
            kp.key(event.key);
        }
    });
});

$(document).ready(function() {
    var $canvas = $('#thecanvas');
    width = $canvas.width();
    height = $canvas.height();
    canvas = $canvas[0];
    wviz.launch(canvas, width, height, commands);
});
