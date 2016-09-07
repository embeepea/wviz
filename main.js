require('./style.css');
var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var EventTracker = require('./EventTracker.js');
var terrain = require('./terrain.js');
var rain = require('./rain.js');
var URL = require('./url.js');
var kbd_processor = require('./kbd_processor.js');
var wviz = require('./wviz.js');
var ui_commands = require('./ui_commands.js');
var width, height, canvas;
var Permalink = require('./Permalink.js');
window.debug = require('./debug.js');

window.wviz = wviz;

var permalink = null;

var state = {
    wviz: wviz,
    permalink: permalink,
    mouseDragMode: "rotate",   // or "translate"
    nextClickDefinesYellowDotLocation: false,
    dropFallStep: 1,
    displayMessages: false,
    currentKeyState: 1,
    scaleTarget: "world",
    keyStates: [
        null,
        // 1: initial view of terrain from above:
        {"mm":"1.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000,1.0000","ad":"1","ah":"0","af":"1","ae":"0","aa":"0","d3":"1","d2":"0","dm":"r","ac":"0","uv":"","yuv":"","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
        
        // 2: close-up of single drop near edge, showing grid below and single height line
        {"mm":"1.8520,0.1935,1.0073,7.9039,-0.3381,2.0780,0.2224,1.6035,-0.9684,-0.3554,1.8487,-3.5956,0.0000,0.0000,0.0000,1.0000","ad":"1","ah":"1","af":"1","ae":"1","aa":"0","d3":"1","d2":"1","dm":"r","ac":"0","uv":"4,103","yuv":"","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
        
        // 3: closer close-up of same point, with neighbor points and height lines turned on
        {"mm":"2.9884,0.2415,1.4265,19.4095,-0.4420,3.2695,0.3724,2.2451,-1.3776,-0.5251,2.9749,-7.2743,0.0000,0.0000,0.0000,1.0000","ad":"1","ah":"1","af":"1","ae":"1","aa":"0","d3":"1","d2":"1","dm":"t","ac":"0","uv":"4,103","yuv":"","n":"1","h":"1","x":"0","fs":"1","fr":"100"},
        
        // 4:
        {"mm":"7.1768,0.2519,3.8877,62.0296,-0.0597,8.1554,-0.4181,-32.1801,-3.8954,0.3390,7.1690,-33.1736,0.0000,0.0000,0.0000,1.0000","ad":"1","ah":"1","af":"1","ae":"1","aa":"0","d3":"1","d2":"1","dm":"r","ac":"0","uv":"0,175","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
        
        // 5:
        {"mm":"7.1768,0.2519,3.8877,62.0296,-0.0597,8.1554,-0.4181,-32.1801,-3.8954,0.3390,7.1690,-33.1736,0.0000,0.0000,0.0000,1.0000","ad":"1","ah":"1","af":"1","ae":"0","aa":"1","d3":"0","d2":"1","dm":"r","ac":"0","uv":"0,175","yuv":"0,175","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
        
        // 6: 
        {"mm":"17.2504,-0.9044,-0.6819,79.5765,0.9767,17.1485,1.9628,-22.0847,0.5737,-1.9972,17.1622,-22.8619,0.0000,0.0000,0.0000,1.0000","ad":"0","ah":"0","af":"1","ae":"0","aa":"0","d3":"1","d2":"0","dm":"r","ac":"0","uv":"0,175","yuv":"79,140","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
        
        // 7:
        {"mm":"14.1979,-0.9472,4.3499,18.0379,0.4839,14.7816,1.6392,-30.2460,-4.4255,-1.4228,14.1347,-37.1332,0.0000,0.0000,0.0000,1.0000","ad":"0","ah":"0","af":"1","ae":"0","aa":"0","d3":"1","d2":"0","dm":"t","ac":"0","yuv":"130,148","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
        
        //// 8:
        //{"mm":"17.1607,-11.1601,11.2039,144.2850,10.6984,20.3692,3.9020,34.2592,-11.6454,2.2669,20.0948,-107.2979,0.0000,0.0000,0.0000,1.0000","ad":"0","ah":"0","af":"1","ae":"0","aa":"0","d3":"1","d2":"0","dm":"r","ac":"0","yuv":"43,144","n":"0","h":"0","x":"0","fs":"1","fr":"100"},

        //// 8:
        //{"mm":"10.9973,-8.8514,4.7027,-88.1564,9.3599,11.5667,-0.1186,24.7755,-3.5850,3.0459,14.1164,1.6904,0.0000,0.0000,0.0000,1.0000","ad":"0","ah":"0","af":"1","ae":"0","aa":"0","d3":"1","d2":"0","dm":"r","ac":"0","yuv":"175,57","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
        
        // // 10:
        // {"mm":"7.9356,-11.3652,5.4096,-87.8496,12.2702,8.4106,-0.3308,-4.5005,-2.8050,4.6375,13.8574,5.1168,0.0000,0.0000,0.0000,1.0000","ad":"0","ah":"0","af":"1","ae":"0","aa":"0","d3":"1","d2":"0","dm":"r","ac":"0","yuv":"174,57","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
        
        //// 9:
        //{"mm":"3.4054,-2.8911,-0.3615,-12.7153,2.8561,3.4224,-0.4642,1.8894,0.5755,0.1223,4.4429,-14.9629,0.0000,0.0000,0.0000,1.0000","ad":"0","ah":"0","af":"1","ae":"0","aa":"0","d3":"1","d2":"0","dm":"t","ac":"0","uv":"160,86","yuv":"160,86","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
        
        //// 10:
        //{"mm":"2.0191,-1.8920,0.7139,-2.2258,1.9862,2.0450,-0.1984,0.8806,-0.3796,0.6364,2.7599,-8.1124,0.0000,0.0000,0.0000,1.0000","ad":"0","ah":"0","af":"1","ae":"0","aa":"0","d3":"1","d2":"0","dm":"r","ac":"0","uv":"143,120","yuv":"143,120","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
        
        // 8:
        {"mm":"0.5466,-0.0270,-0.4994,-2.2505,0.0692,0.7367,0.0359,1.0779,0.4953,-0.0732,0.5460,-0.0965,0.0000,0.0000,0.0000,1.0000","ad":"0","ah":"0","af":"1","ae":"0","aa":"0","d3":"0","d2":"1","dm":"r","ac":"0","n":"0","h":"0","x":"0","fs":"1","fr":"100"}
        
    ]

    //visible: {
    //    edges: false,
    //    faces: true,
    //    axes: false,
    //    base: true,
    //    baseArrows: false,
    //    d2: false,
    //    d3: true
    //}
};

//  wviz.setEdges(state.visible["edges"]);
//  wviz.setFaces(state.visible["faces"]);
//  wviz.setAxes(state.visible["axes"]);
//  wviz.setBase(state.visible["base"]);
//  wviz.setBaseArrows(state.visible["baseArrows"]);
//  wviz.set2D(state.visible["d2"]);
//  wviz.set3D(state.visible["d3"]);


var commands = ui_commands(state);

function displayMessage(msg) {
    if (msg==="" || typeof(msg)==="undefined") {
        hideMessage();
    } else {
        if (!state.displayMessages) { return; }
        $('#message').attr("style","");
        $('#message').removeClass("display-none");
        $('#message').addClass("display-block");
        $('#message').html(msg);
    }
}
state.displayMessage = displayMessage;

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

function displayModalOverlay(msg) {
    if (msg==="" || typeof(msg)==="undefined") {
        hideModalOverlay();
    } else {
        if (!state.displayMessages) { return; }
        $('#modaloverlay').attr("style","");
        $('#modaloverlay').removeClass("display-none");
        $('#modaloverlay').addClass("display-block");
        $('.modaloverlay.content textarea').html(msg);
    }
}
state.displayModalOverlay = displayModalOverlay;

function hideModalOverlay() {
    $('#modaloverlay').attr("style","");
    $('#modaloverlay').removeClass("display-block");
    $('#modaloverlay').addClass("display-none");
    $('#modaloverlay.content textarea').html("");
}

wviz.addListener("uvset", function(e) {
    if (permalink) {
        permalink.set("uv", e.uv);
        permalink.updateWindowURL();
    }
});
wviz.addListener("yuvset", function(e) {
    if (permalink) {
        permalink.set("yuv", e.uv);
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
    state.permalink = Permalink(URL({url: window.location.toString()}), commands);
    permalink = state.permalink;
    window.permalink = permalink;
    var moving = wviz.world;
    var center = wviz.axes;
    var frame  = wviz.camera;
    var eventTracker = EventTracker.eventTracker(canvas, {
        mouseDown: function(p) {
            wviz.pick(p.x, p.y, function(x,y,z) {
                center.position.set(x,y,z);
                //if (permalink) {
                //    permalink.set("center", [x,y,z]);
                //    permalink.updateWindowURL();
                //}
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
                        var uv = wviz.m.xy_to_uv([x,y]);
                        if (state.nextClickDefinesYellowDotLocation) {
                            state.nextClickDefinesYellowDotLocation = false;
                            wviz.yellowDrop.moveToUV(uv);
                        } else {
                            wviz.blueDrop.clearTrail();
                            wviz.blueDrop.moveToUV(uv);
                        }
                        wviz.requestRender();
                    }, function() {
                    });
                }
                if (event.ctrlKey && event.button === 0) {
                    // ctrl-left-click event
                    wviz.pick(p.x, p.y, function(x,y,z) {
                        var uv = wviz.m.xy_to_uv([x,y]);
                        wviz.yellowDrop.clearTrail();
                        wviz.yellowDrop.moveToUV(uv);
                        wviz.requestRender();
                    }, function() {
                        wviz.yellowDrop.terrainDropObj.visible = false;
                        wviz.yellowDrop.flatDropObj.visible = false;
                        wviz.requestRender();
                    });
                }
            }
        },
        mouseWheel: function(delta, p) {
            wviz.pick(p.x, p.y, function(x,y,z) {
                center.position.set(x,y,z);
                //if (permalink) {
                //    permalink.set("center", [x,y,z]);
                //    permalink.updateWindowURL();
                //}
            });
            var s = Math.exp(delta/20.0);
            if (state.scaleTarget === "world") {
                var R = new THREE.Matrix4().makeScale(s,s,s);
                var M = EventTracker.computeTransform(moving,center,frame, R);
                moving.matrix.multiplyMatrices(moving.matrix, M);
                if (permalink) {
                    permalink.set("mm", moving.matrix);
                    permalink.updateWindowURL();
                }
                moving.matrixWorldNeedsUpdate = true;
            } else if (state.scaleTarget === "blueDrop") {
                wviz.setBlueDropRadius(s*wviz.getBlueDropRadius());
            }
            wviz.requestRender();
        },
        keyPress: function(event) {
            kp.key(event.key);
        }
    });
});

function constructState() {
    var st = {};
    commands.forEach(function(cmd) {
        if (cmd.permalink && cmd.permalink.urlKey) {
            st[cmd.permalink.urlKey] = cmd.permalink.toString(cmd.permalink.getState());
        }
    });
    return st;
}
state.constructState = constructState;

$(document).ready(function() {
    var $canvas = $('#thecanvas');
    width = $canvas.width();
    height = $canvas.height();
    canvas = $canvas[0];
    $(".modaloverlay.header button").click(function() {
        hideModalOverlay();
    });
    wviz.launch(canvas, width, height, commands);
});
