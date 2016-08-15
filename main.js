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
        radius: 0.1
    }
};

var state = {
};

var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var EventTracker = require('./libs/EventTracker/EventTracker.js')(THREE);
var terrain = require('./terrain.js');


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

function launch(canvas, width, height) {

    var renderer = new THREE.WebGLRenderer({
        canvas: canvas
    });
    renderer.setSize( width, height );
    renderer.setClearColor(settings.backgroundColor, 1);

    var camera = createCamera(width, height);
    var world = new THREE.Object3D();
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

    function requestRender() {
        requestAnimationFrame( render );
    };

    var m = null;
    var faces = null;
    terrain.load('./data/dem2.mesh', settings, function(t) {
        m = t.m;
        faces = t.faces;
        world.add(t.faces);
        zNudgedEdges.add(t.edges);
        world.add(t.lattice);
        requestRender();
    });

    function makeDrop() {
        var geometry = new THREE.SphereGeometry( settings.drop.radius, 16, 16 );
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
        sphere.visible = false;
        sphere.add( new THREE.Mesh( geometry, surfaceMaterial ) );
        return sphere;
    }
    var drop = makeDrop();
    world.add( drop );
    function moveDropToIJ(i,j) {
        if (!m) { return; }
        var xy = m.ij_to_xy([i,j]);
        var x = xy[0];
        var y = xy[1];
        var z = m.meshData[j][i]+settings.drop.radius;
        //console.log(sprintf("drop now at (%f,%f,%f)", x,y,z));
        state.dropIJ = [i,j];
        drop.visible = true;
        drop.position.set(x,y,z);
    }
    function moveDropToXYZ(x,y,z) {
        //console.log(sprintf("drop now at (%f,%f,%f)", x,y,z));
        drop.visible = true;
        drop.position.set(x,y,z);
    }

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
            if (iobj.object === faces) {
                if (iobj.distance < minDist) {
                    minDist = iobj.distance;
                    minObj = iobj;
                }
            }
        });
        //console.log(minObj);
        if (minObj) {
            var Tw = world.matrixWorld;
            var TwInv = new THREE.Matrix4();    
            TwInv.getInverse(Tw);
            var p = new THREE.Vector4(minObj.point.x,minObj.point.y,minObj.point.z,1);
            p.applyMatrix4(TwInv);
            //console.log(p);
            var x = p.x / p.w;
            var y = p.y / p.w;
            var z = p.z / p.w;
            //moveDropToXYZ(x,y,z);
            var ij = m.xy_to_ij([x,y]);
            moveDropToIJ(ij[0], ij[1]);
            requestRender();
        }
    }

    var moving = world;
    var center = world;
    var frame  = camera;

    var eventTracker = EventTracker(canvas, {
        mouseDown: function(p) {
        },
        mouseDrag: function(p, dp) {
            // Note: the axis of rotation for a mouse displacement of (dp.x,dp.y) would
            // normally be (-dp.y, dp.x, 0), but since the y direction of screen coords
            // is reversed (increasing towards the bottom of the screen), we need to negate
            // the y coord here; therefore we use (dp.y, dp.x, 0):
            var v = new THREE.Vector3(dp.y, dp.x, 0).normalize();
            var d = Math.sqrt(dp.x*dp.x + dp.y*dp.y);
            var angle = (d / canvas.width) * Math.PI;
            var R = new THREE.Matrix4().makeRotationAxis(v, angle);
            var M = eventTracker.computeTransform(moving,center,frame, R);
            moving.matrix.multiplyMatrices(moving.matrix, M);
            moving.matrixWorldNeedsUpdate = true;
            requestRender();
        },
        mouseUp: function(p, t, d, b, s) {
            if (t < 150) {
                if (s && b === 0) {
                    // shift-left-click event
                    //console.log(sprintf("[%1d,%1d]", p.x, p.y));
                    pick(p.x, p.y);
                }
            }
        },
        mouseWheel: function(delta) {
            var s = Math.exp(delta/20.0);
            var R = new THREE.Matrix4().makeScale(s,s,s);
            var M = eventTracker.computeTransform(moving,center,frame, R);
            moving.matrix.multiplyMatrices(moving.matrix, M);
            moving.matrixWorldNeedsUpdate = true;
            requestRender();
        },
        keyPress: function(event) {
            //console.log(event.key);
            //if (event.key === 't') { state.toggleT1(); }
            if (event.key === ' ') {
                if (state.dropIJ) {
                    var nextIJ = m.flow[state.dropIJ[0]][state.dropIJ[1]];
                    if (nextIJ) {
                        moveDropToIJ(nextIJ[0], nextIJ[1]);
                        requestRender();
                    }
                }
            }
            if (event.key === 's') {
                drop.visible = !drop.visible;
                requestRender();
            }
        }
    });
}


$(document).ready(function() {
    var $canvas = $('#thecanvas');
    var width = $canvas.width();
    var height = $canvas.height();
    var canvas = $canvas[0];
    launch(canvas, width, height);
});
