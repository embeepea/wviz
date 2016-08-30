require('./style.css');
var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var EventTracker = require('./EventTracker.js');
var terrain = require('./terrain.js');
var rain = require('./rain.js');
var URL = require('./url.js');
var kbd_processor = require('./kbd_processor.js');
var wviz = require('./wviz.js');
var MultiPolygon = require('./MultiPolygon.js');
var ui_commands = require('./ui_commands.js');
var width, height, canvas;
var Permalink = require('./Permalink.js');
window.debug = require('./debug.js');

var permalink = null;

var state = {
    wviz: wviz,
    permalink: permalink,
    scaleTarget: "world",      // or "drop"
    mouseDragMode: "rotate",   // or "translate"
    visible: {
        edges: false,
        faces: true,
        axes: false,
        lattice: true,
        latticeArrows: false,
        d2: false,
        d3: true
    }
};

//  wviz.setEdges(state.visible["edges"]);
//  wviz.setFaces(state.visible["faces"]);
//  wviz.setAxes(state.visible["axes"]);
//  wviz.setLattice(state.visible["lattice"]);
//  wviz.setLatticeArrows(state.visible["latticeArrows"]);
//  wviz.set2D(state.visible["d2"]);
//  wviz.set3D(state.visible["d3"]);


var commands = ui_commands(state);

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

wviz.addListener("ijset", function(e) {
    if (permalink) {
        permalink.set("ij", e.ij);
        permalink.updateWindowURL();
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
            //console.log(p);
                    wviz.pick(p.x, p.y, function(x,y,z) {
                        center.position.set(x,y,z);
                        if (permalink) {
                            permalink.set("center", [x,y,z]);
                            permalink.updateWindowURL();
                        }
                        wviz.requestRender();
                    });

        },
        mouseDrag: function(p, dp, button) {
            // Note: the axis of rotation for a mouse displacement of (dp.x,dp.y) would
            // normally be (-dp.y, dp.x, 0), but since the y direction of screen coords
            // is reversed (increasing towards the bottom of the screen), we need to negate
            // the y coord here; therefore we use (dp.y, dp.x, 0):
            var v, d, angle, L=null;
            if (state.mouseDragMode === "rotate") {
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
            } else if (state.mouseDragMode === "translate") {
                L = new THREE.Matrix4().makeTranslation(dp.x/25, -dp.y/25, 0);
            }
            if (L) {
                var M = EventTracker.computeTransform(moving,center,frame, L);
                moving.matrix.multiplyMatrices(moving.matrix, M);
                if (permalink) {
                    permalink.set("mm", moving.matrix);
                    permalink.updateWindowURL();
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
                        wviz.drop.clearTrail();
                        wviz.drop.moveToIJ(ij[0], ij[1]);
                        wviz.requestRender();
                    });
                }
                if (event.ctrlKey && event.button === 0) {
                    // ctrl-left-click event
                    wviz.pick(p.x, p.y, function(x,y,z) {
                        center.position.set(x,y,z);
                        if (permalink) {
                            permalink.set("center", [x,y,z]);
                            permalink.updateWindowURL();
                        }
                        wviz.requestRender();
                    });
                }
            }
        },
        mouseWheel: function(delta, p) {
            var s;
            if (state.scaleTarget === "world") {
                wviz.pick(p.x, p.y, function(x,y,z) {
                    center.position.set(x,y,z);
                    if (permalink) {
                        permalink.set("center", [x,y,z]);
                        permalink.updateWindowURL();
                    }
                });
                s = Math.exp(delta/20.0);
                var R = new THREE.Matrix4().makeScale(s,s,s);
                var M = EventTracker.computeTransform(moving,center,frame, R);
                moving.matrix.multiplyMatrices(moving.matrix, M);
                if (permalink) {
                    permalink.set("mm", moving.matrix);
                    permalink.updateWindowURL();
                }
                moving.matrixWorldNeedsUpdate = true;
                wviz.requestRender();
            } else if (state.scaleTarget === "drop") {
                s = Math.exp(delta/20.0);
                wviz.settings.drop.radius *= s;
                wviz.drop.setRadius(wviz.settings.drop.radius);
                if (permalink) {
                    permalink.set("dr", wviz.settings.drop.radius);
                    permalink.updateWindowURL();
                }
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
