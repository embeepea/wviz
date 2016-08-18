require('./style.css');

var settings = {
    backgroundColor: 0x555555,
    terrain: {
        diffuseColor: 0x88ff88,
        edgeColor: 0x000000,
        lineWidth: 1,
        edgeZNudge: 0.01,
        latticeZ: -2,
        latticeColor: 0x000000
    },
    lights: {
        point: [
            { position: [ 0,  0, 10], color: 0xffffff, intensity: 0.6, distance: 0, decay: 1 },
            { position: [10,  0,  0], color: 0xffffff, intensity: 0.6, distance: 0, decay: 1 },
            { position: [ 0, 10,  0], color: 0xffffff, intensity: 0.6, distance: 0, decay: 1 }
        ]
    },
    camera: {
        fov: 45,
        position: [1,-15,15],
        up: [0,1,0],
        lookAt: [0,0,0]
    },
    drop: {
        radius: 0.1,
        fallSpeed: 100
    }
};

var state = {
    mouseWheelMode: "scale",
    mouseDragMode: "rotate"
};

var commands = [
    { seq: "ae",
      action: toggleEdges,
      msgfunc: function() { return "toggle edges"; } },
    { seq: "af",
      action: toggleFaces,
      msgfunc: function() { return "toggle faces"; } },
    { seq: "aw",
      action: lineWidth,
      msgfunc: function() { return "line width"; } },
    { seq: "ac",
      action: toggleAxes,
      msgfunc: function() { return "toggle axes"; } },
    { seq: "l",
      action: toggleLattice,
      msgfunc: function() { return "toggle lattice"; } },
    { seq: "s",
      action: setFallSpeed,
      msgfunc: function(n) { return sprintf("speed set to %1d", n); } },
    { seq: " ",
      action: advanceOnce,
      msgfunc: function() { return "advance once"; } },
    { seq: ".",
      action: advanceAll,
      msgfunc: function() { return "advance all"; } },
    { seq: "n",
      action: toggleNeighbors,
      msgfunc: function() { return "toggle neighbor points"; } },
    { seq: "ds",
      action: toggleDropScale,
      msgfunc: function() { return "toggle drop scale"; } },
    { seq: "t",
      action: translateMode,
      msgfunc: function() { return "translate"; } },
    { seq: "r",
      action: rotateMode,
      msgfunc: function() { return "rotate"; } }
];

var requestRender;

function lineWidth(a) { console.log(sprintf("lineWidth(%1d)", a)); }

function translateMode() {
    state.mouseDragMode = "translate";
}
function rotateMode() {
    state.mouseDragMode = "rotate";
}

function setFallSpeed(n) {
    settings.drop.fallSpeed = n;
}

function toggleEdges() {
    state.edges.visible = !state.edges.visible;
    requestRender();
}
function toggleLattice() {
    state.lattice.visible = !state.lattice.visible;
    requestRender();
}
function toggleFaces() {
    state.faces.visible = !state.faces.visible;
    requestRender();
}
function toggleAxes() {
    state.axes.visible = !state.axes.visible;
    requestRender();
}

function advanceOnce(a) {
    if (state.dropIJ) {
        if (typeof(a)==="undefined") { a = 1; }
        while (a-- > 0) {
            var nextIJ = state.m.flow[state.dropIJ[0]][state.dropIJ[1]];
            if (nextIJ) {
                moveDropToIJ(nextIJ[0], nextIJ[1]);
                requestRender();
            }
        }
    }
}

function advanceAll(a) {
    if (state.dropIJ) {
        function oneStep() {
            var nextIJ = state.m.flow[state.dropIJ[0]][state.dropIJ[1]];
            if (nextIJ) {
                moveDropToIJ(nextIJ[0], nextIJ[1]);
                requestRender(function() {
                    setTimeout(oneStep, settings.drop.fallSpeed);
                });
            }
        }
        oneStep();
    }
}

function toggleNeighbors() {
    if (state.neighbors) {
        state.world.remove(state.neighbors);
        state.neighbors = null;
    } else {
        state.neighbors = makeNeighborPoints();
        state.world.add(state.neighbors);
    }
    requestRender();
}

function moveDropToIJ(i,j) {
    if (!state.m) { return; }
    var xy = state.m.ij_to_xy([i,j]);
    var x = xy[0];
    var y = xy[1];
    var z = state.m.meshData[j][i]+settings.drop.radius;
    state.dropIJ = [i,j];
    state.drop.visible = true;
    state.drop.position.set(x,y,z);
}
function moveDropToXYZ(x,y,z) {
    state.drop.visible = true;
    state.drop.position.set(x,y,z);
}


function toggleDropScale() {
    if (state.mouseWheelMode === "scale") {
        state.mouseWheelMode = "dropScale";
    } else {
        state.mouseWheelMode = "scale";
    }
}


var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var EventTracker = require('./libs/EventTracker/EventTracker.js')(THREE);
var terrain = require('./terrain.js');
var kbd_processor = require('./kbd_processor.js');

function createCamera(width, height) {
    var camera = new THREE.PerspectiveCamera( settings.camera.fov,
                                              width / height, 0.1, 1000 );
    camera.matrixAutoUpdate = false;

    camera.position.set(settings.camera.position[0],
                        settings.camera.position[1],
                        settings.camera.position[2]);
    camera.up.set(settings.camera.up[0],
                  settings.camera.up[1],
                  settings.camera.up[2]);
    camera.lookAt(new THREE.Vector3(settings.camera.lookAt[0],
                                    settings.camera.lookAt[1],
                                    settings.camera.lookAt[2]));

    camera.updateMatrix();
    camera.matrixWorldNeedsUpdate = true;
    return camera;
}

function axis3D(options) {
    var tipMat = new THREE.MeshPhongMaterial({
        color: options.tipColor,
        //side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var lineMat = new THREE.LineBasicMaterial({
        color: options.axisColor,
        linewidth: 3
    });
    var container = new THREE.Object3D();
    var r = 0.2;
    var h = 1.0;
    var rSegs = 8;
    var hSegs = 1;
    var tipObj = new THREE.Object3D();
    tipObj.add(new THREE.Mesh(new THREE.ConeGeometry(options.tipRadius,
                                                     options.tipHeight,
                                                     rSegs, hSegs, false, 0, 2*Math.PI), tipMat));
    tipObj.position.set(0,options.length/2,0);
    container.add(tipObj);

    var shaftGeom = new THREE.Geometry();
    shaftGeom.vertices.push(new THREE.Vector3(0,-options.length/2,0));
    shaftGeom.vertices.push(new THREE.Vector3(0,options.length/2,0));
    container.add(new THREE.LineSegments(shaftGeom, lineMat));

    if (options.axis === 'Z') {
        container.rotateX(Math.PI/2);
    } else if (options.axis === 'X') {
        container.rotateZ(-Math.PI/2);
    }

    return container;
}
function axes3D(options) {
    var axes = new THREE.Object3D();
    axes.add(axis3D({
        axisColor: 0xff0000,
        tipColor: 0xff0000,
        axis: 'X',
        length: options.length,
        tipRadius: options.tipRadius,
        tipHeight: options.tipHeight
    }));
    axes.add(axis3D({
        axisColor: 0x00ff00,
        tipColor: 0x00ff00,
        axis: 'Y',
        length: options.length,
        tipRadius: options.tipRadius,
        tipHeight: options.tipHeight
    }));
    axes.add(axis3D({
        axisColor: 0x0000ff,
        tipColor: 0x0000ff,
        axis: 'Z',
        length: options.length,
        tipRadius: options.tipRadius,
        tipHeight: options.tipHeight
    }));
    return axes;
}

function makeNeighborPoints() {
    if (!state.dropIJ) { return null; }
    var i = state.dropIJ[0];
    var j = state.dropIJ[1];
    var ii, jj;
    var points = [];
    for (ii=i-1; ii<=i+1; ++ii) {
        for (jj=j-1; jj<=j+1; ++jj) {
            if ((ii!==i || jj!==j)
                && ii >= 0 && ii < state.m.N
                && jj >= 0 && jj < state.m.M) {
                points.push([ii,jj]);
                //var xy = state.m.ij_to_xy([ii,jj]);
                //points.push([xy[0], xy[1], state.m.meshData[jj][ii]]);
            }
        }
    }
    var neighbors = new THREE.Object3D();
    
    var yellowSurfaceMaterial = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var blueSurfaceMaterial = new THREE.MeshPhongMaterial({
        color: 0x0000ff,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    points.forEach(function(point) {
        var xy = state.m.ij_to_xy(point);
        var next = state.m.flow[state.dropIJ[0]][state.dropIJ[1]];
        var mat = (point[0]===next[0] && point[1]===next[1]) ? blueSurfaceMaterial : yellowSurfaceMaterial;
        var mesh = new THREE.Mesh(new THREE.SphereGeometry( settings.drop.radius/2, 8, 8 ), mat);
        mesh.position.set(xy[0], xy[1], state.m.meshData[point[1]][point[0]]);
        neighbors.add( mesh );
    });
    return neighbors;
}

function latticeDistance([i0,j0],[i1,j1]) {
    return Math.max(Math.abs(i0-i1), Math.abs(j0-j1));
}

function lowPoints() {
    var i, j;
    var points = [];
    var segsGeom = new THREE.Geometry();
    for (i=0; i<state.m.N; ++i) {
        for (j=0; j<state.m.M; ++j) {
            var next = state.m.flow[i][j];
            if (next != null && latticeDistance([i,j],next) > 1) {
                var xy = state.m.ij_to_xy([i,j]);
                points.push([xy[0], xy[1], state.m.meshData[j][i]]);
                segsGeom.vertices.push(new THREE.Vector3(xy[0], xy[1], state.m.meshData[j][i]));
                var nxy = state.m.ij_to_xy(next);
                segsGeom.vertices.push(new THREE.Vector3(nxy[0], nxy[1], state.m.meshData[next[1]][next[0]]));
            }
        }
    }
    var lows = new THREE.Object3D();
    var redSurfaceMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var lineMat = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2
    });
    console.log(sprintf("1 #lowpoints = %1d", points.length));
    //state.m.flow2();
    points.forEach(function(point) {
        var mesh = new THREE.Mesh(new THREE.SphereGeometry( settings.drop.radius/2, 8, 8 ), redSurfaceMaterial);
        mesh.position.set(point[0], point[1], point[2]);
        lows.add( mesh );
    });
    lows.add(new THREE.LineSegments(segsGeom, lineMat));
    return lows;
}

function lowPoints2() {
    var lows = new THREE.Object3D();
    var redSurfaceMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    console.log(state.m);
    state.m.lowPoints.forEach(function(ij) {
        var xy = state.m.ij_to_xy([ij[0], ij[1]]);
        var mesh = new THREE.Mesh(new THREE.SphereGeometry( settings.drop.radius/2, 8, 8 ), redSurfaceMaterial);
        mesh.position.set(xy[0], xy[1], state.m.meshData[ij[1]][ij[0]]);
        lows.add( mesh );
    });
    return lows;
}

function launch(canvas, width, height) {

    var renderer = new THREE.WebGLRenderer({
        canvas: canvas
    });
    renderer.setSize( width, height );
    renderer.setClearColor(settings.backgroundColor, 1);

    var camera = createCamera(width, height);
    var world = new THREE.Object3D();
    state.world = world;
    var zNudgedEdges = new THREE.Object3D();
    world.matrixAutoUpdate = false;
    zNudgedEdges.matrixAutoUpdate = false;
    world.add(zNudgedEdges);
    state.axes = axes3D({
        length: 0.75,
        tipRadius: 0.05,
        tipHeight: 0.3
    });
    world.add(state.axes);
    var scene = new THREE.Scene();
    var worldContainer = new THREE.Object3D();
    worldContainer.add( world );
    scene.add( camera );
    scene.add( worldContainer );
    scene.add( new THREE.AmbientLight( 0x222222 ) );
    settings.lights.point.forEach(function(lt) {
        var light = new THREE.PointLight( lt.color, lt.intensity, lt.distance, lt.decay );
        light.position.set(lt.position[0], lt.position[1], lt.position[2]);
        scene.add( light );
    });

    function render() {
        var T = new THREE.Matrix4().makeTranslation(0, 0, settings.terrain.edgeZNudge);
        var M = eventTracker.computeTransform(zNudgedEdges,camera,camera, T);
        zNudgedEdges.matrix = M;
        zNudgedEdges.matrixWorldNeedsUpdate = true;
        renderer.render( scene, camera );
    };

    requestRender = function(f) {
        // optional arg f is a function that will be called immediately after rendering happens
        if (typeof(f)==='function') {
            requestAnimationFrame( function() {
                render();
                f();
            });
        } else {
            requestAnimationFrame( render );
        }
    };

    var m = null;
    terrain.load('./data/dem3.mesh', settings, function(t) {
        state.m = t.m;
        state.faces = t.faces;
        world.add(t.faces);
        zNudgedEdges.add(t.edges);
        state.edges = t.edges;
        world.add(t.lattice);
        state.lattice = t.lattice;
        var lows = lowPoints2();
        world.add(lows);
        requestRender();
    });

    function makeDrop() {
        //var geometry = new THREE.SphereGeometry( settings.drop.radius, 16, 16 );
        var geometry = new THREE.SphereGeometry( 1, 16, 16 );
        var surfaceMaterial = new THREE.MeshPhongMaterial({
            color: 0x3333ff,
            side: THREE.DoubleSide,
            shading: THREE.SmoothShading
        });
        var wireMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true,
            wireframeLinewidth: 2
        });
        var sphere = new THREE.Object3D();
        //sphere.visible = false;
        sphere.add( new THREE.Mesh( geometry, surfaceMaterial ) );
        var container = new THREE.Object3D();
        container.add(sphere);
        container.visible = false;
        container.scale.set(settings.drop.radius,
                            settings.drop.radius,
                            settings.drop.radius);
        return container;
    }
    state.drop = makeDrop();
    world.add( state.drop );

    var raycaster = new THREE.Raycaster();

    function pick(x,y,callback) {
        var mouse = new THREE.Vector2();
        mouse.x = ( x / window.innerWidth ) * 2 - 1;
        mouse.y = - ( y / window.innerHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObjects( scene.children, true );
        var minDist = 999999;
        var minObj = null;
        intersects.forEach(function(iobj) {
            if (iobj.object === state.faces) {
                if (iobj.distance < minDist) {
                    minDist = iobj.distance;
                    minObj = iobj;
                }
            }
        });
        if (minObj) {
            var Tw = world.matrixWorld;
            var TwInv = new THREE.Matrix4();    
            TwInv.getInverse(Tw);
            var p = new THREE.Vector4(minObj.point.x,minObj.point.y,minObj.point.z,1);
            p.applyMatrix4(TwInv);
            callback(p.x/p.w, p.y/p.w, p.z/p.w);
        }
    }

    var moving = world;
    var center = state.axes;
    var frame  = camera;

    var kp = kbd_processor(commands,
                           function(msg) {
                               displayMessage(msg);
                           },
                           function(msg) {
                               displayMessage(msg);
                               fadeMessage();
                           });
    var eventTracker = EventTracker(canvas, {
        mouseDown: function(p) {
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
                var M = eventTracker.computeTransform(moving,center,frame, L);
                moving.matrix.multiplyMatrices(moving.matrix, M);
                moving.matrixWorldNeedsUpdate = true;
                requestRender();
            }
        },
        mouseUp: function(p, t, d, event) {
            if (t < 150) {
                if (event.shiftKey && event.button === 0) {
                    // shift-left-click event
                    pick(p.x, p.y, function(x,y,z) {
                        var ij = state.m.xy_to_ij([x,y]);
                        moveDropToIJ(ij[0], ij[1]);
                        requestRender();
                    });
                }
                if (event.ctrlKey && event.button === 0) {
                    // ctrl-left-click event
                    console.log(sprintf("center at (%f,%f)", p.x, p.y));
                    //pick(p.x, p.y);
                    pick(p.x, p.y, function(x,y,z) {
                        state.axes.position.set(x,y,z);
                        requestRender();
                    });
                }
            }
        },
        mouseWheel: function(delta) {
            var s;
            if (state.mouseWheelMode === "scale") {
                s = Math.exp(delta/20.0);
                var R = new THREE.Matrix4().makeScale(s,s,s);
                var M = eventTracker.computeTransform(moving,center,frame, R);
                moving.matrix.multiplyMatrices(moving.matrix, M);
                moving.matrixWorldNeedsUpdate = true;
                requestRender();
            } else if (state.mouseWheelMode === "dropScale") {
                s = Math.exp(delta/20.0);
                settings.drop.radius *= s;
                state.drop.scale.set(settings.drop.radius,
                                     settings.drop.radius,
                                     settings.drop.radius);
                requestRender();
            }
        },
        keyPress: function(event) {
            kp.key(event.key);
        }
    });
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


$(document).ready(function() {
    var $canvas = $('#thecanvas');
    var width = $canvas.width();
    var height = $canvas.height();
    var canvas = $canvas[0];
    launch(canvas, width, height);
});
