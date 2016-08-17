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
    terrain.load('./data/dem2.mesh', settings, function(t) {
        state.m = t.m;
        state.faces = t.faces;
        world.add(t.faces);
        zNudgedEdges.add(t.edges);
        state.edges = t.edges;
        world.add(t.lattice);
        state.lattice = t.lattice;
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
        //container.matrixAutoUpdate = false;
        //container.matrixWorldNeedsUpdate = true;
        /*
        sphere.scale = new THREE.Vector3(settings.drop.radius,
                                         settings.drop.radius,
                                         settings.drop.radius);
         */
        //return sphere;
        return container;
    }
    state.drop = makeDrop();
    world.add( state.drop );

    var raycaster = new THREE.Raycaster();

    function pick(x,y) {
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
            var x = p.x / p.w;
            var y = p.y / p.w;
            var z = p.z / p.w;
            //moveDropToXYZ(x,y,z);
            var ij = state.m.xy_to_ij([x,y]);
            moveDropToIJ(ij[0], ij[1]);
            requestRender();
        }
    }

    var moving = world;
    var center = world;
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
        mouseDrag: function(p, dp) {
            // Note: the axis of rotation for a mouse displacement of (dp.x,dp.y) would
            // normally be (-dp.y, dp.x, 0), but since the y direction of screen coords
            // is reversed (increasing towards the bottom of the screen), we need to negate
            // the y coord here; therefore we use (dp.y, dp.x, 0):
            var v, d, angle, L=null;
            if (state.mouseDragMode === "rotate") {
                v = new THREE.Vector3(dp.y, dp.x, 0).normalize();
                d = Math.sqrt(dp.x*dp.x + dp.y*dp.y);
                angle = (d / canvas.width) * Math.PI;
                L = new THREE.Matrix4().makeRotationAxis(v, angle);
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
        mouseUp: function(p, t, d, b, s) {
            if (t < 150) {
                if (s && b === 0) {
                    // shift-left-click event
                    pick(p.x, p.y);
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
