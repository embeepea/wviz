require('./style.css');
var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var EventTracker = require('./libs/EventTracker/EventTracker.js')(THREE);
var terrain = require('./terrain.js');
var kbd_processor = require('./kbd_processor.js');
var rain = require('./rain.js');
var URL = require('./url.js');

window.debug = require('./debug.js');

var wviz = {};

wviz.settings = {
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

window.state = state;

var commands = [
    { seq: "ae",
      action: toggleEdges,
      msgfunc: function() { return "edges " + (state.edges.visible ? "on" : "off"); } },
    { seq: "af",
      action: toggleFaces,
      msgfunc: function() { return "faces " + (state.faces.visible ? "on" : "off"); } },
    { seq: "aw",
      action: lineWidth,
      msgfunc: function() { return "line width"; } },
    { seq: "ac",
      action: toggleAxes,
      msgfunc: function() { return "axes " + (state.axes.visible ? "on" : "off"); } },
    { seq: "al",
      action: toggleLattice,
      msgfunc: function() { return "lattice " + (state.lattice.visible ? "on" : "off"); } },
    { seq: "fs",
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
    { seq: "h",
      action: toggleHeightLines,
      msgfunc: function() { return "toggle height lines"; } },
    { seq: "x",
      action: toggleText,
      msgfunc: function() { return "toggle text"; } },
    { seq: "ds",
      action: toggleDropScale,
      msgfunc: function() { return "toggle drop scale"; } },
    { seq: "br",
      action: function() { rain.beginRain(wviz.settings, state, wviz.settings.drop.fallSpeed, requestRender); },
      msgfunc: function() { return "begin rain"; } },
    { seq: "er",
      action: function() { rain.endRain(state, requestRender); },
      msgfunc: function() { return "end rain"; } },
    { seq: "t",
      action: translateMode,
      msgfunc: function() { return "translate"; } },
    { seq: "r",
      action: rotateMode,
      msgfunc: function() { return "rotate"; } }
];

var requestRender;

function lineWidth(a) {
    if (a) {
        state.edges.material.linewidth = a;
        state.lattice.material.linewidth = a;
        requestRender();
    }
    //console.log(state.edges);
}

function translateMode() {
    state.mouseDragMode = "translate";
}
function rotateMode() {
    state.mouseDragMode = "rotate";
}

function setFallSpeed(n) {
    wviz.settings.drop.fallSpeed = n;
}

wviz.setEdges = function(v) {
    state.edges.visible = v;
};
wviz.setFaces = function(v) {
    state.faces.visible = v;
};
wviz.setAxes = function(v) {
    state.axes.visible = v;
};
wviz.setLattice = function(v) {
    state.lattice.visible = v;
};
wviz.setIJ = function(ij) {
    state.drop.moveToIJ(ij[0], ij[1]);
};

function toggleEdges() {
    wviz.setEdges(!state.edges.visible);
    wviz.permalink.setEdges(state.edges.visible);
    wviz.updatePermalink();
    requestRender();
}

function toggleFaces() {
    wviz.setFaces(!state.faces.visible);
    wviz.permalink.setFaces(state.faces.visible);
    wviz.updatePermalink();
    requestRender();
}

function toggleAxes() {
    wviz.setAxes(!state.axes.visible);
    wviz.permalink.setAxes(state.axes.visible);
    wviz.updatePermalink();
    requestRender();
}
function toggleLattice() {
    wviz.setLattice(!state.lattice.visible);
    wviz.permalink.setLattice(state.lattice.visible);
    wviz.updatePermalink();
    requestRender();
}

function makeDrop(m) {
    var geometry = new THREE.SphereGeometry( 1, 16, 16 );
    var surfaceMaterial = new THREE.MeshPhongMaterial({
        color: 0x3333ff,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var sphereScaleObj = new THREE.Object3D();
    sphereScaleObj.scale.set(wviz.settings.drop.radius,
                             wviz.settings.drop.radius,
                             wviz.settings.drop.radius);
    sphereScaleObj.add( new THREE.Mesh( geometry, surfaceMaterial ) );
    var spherePositionObj = new THREE.Object3D();
    spherePositionObj.add(sphereScaleObj);
    spherePositionObj.visible = false;

    var circleScaleObj = new THREE.Object3D();
    circleScaleObj.scale.set(wviz.settings.drop.radius,
                             wviz.settings.drop.radius,
                             wviz.settings.drop.radius);
    circleScaleObj.add( new THREE.Mesh( new THREE.CircleGeometry( 1, 8 ), surfaceMaterial ) );
    var circlePositionObj = new THREE.Object3D();
    circlePositionObj.add(circleScaleObj);
    circlePositionObj.visible = false;

    var obj = new THREE.Object3D();
    obj.add(spherePositionObj);
    obj.add(circlePositionObj);

    return {
        tobj: obj,
        ij: null,
        moveToIJ: function(i,j) {
            var xy = m.ij_to_xy([i,j]);
            var x = xy[0];
            var y = xy[1];
            var z = m.meshData[j][i]+wviz.settings.drop.radius;
            state.drop.ij = [i,j];
            this.ij = [i,j];
            spherePositionObj.visible = true;
            spherePositionObj.position.set(x,y,z);
            circlePositionObj.visible = true;
            circlePositionObj.position.set(x,y,wviz.settings.terrain.latticeZ);
            wviz.permalink.setIJ([i,j]);
            wviz.updatePermalink();
        },
        moveDropToXYZ: function (x,y,z) {
            spherePositionObj.visible = true;
            spherePositionObj.position.set(x,y,z);
            circlePositionObj.visible = true;
            circlePositionObj.position.set(x,y,wviz.settings.terrain.latticeZ);
        },
        setRadius: function(r) {
            sphereScaleObj.scale.set(r,r,r);
            circleScaleObj.scale.set(r,r,r);
        }

    };
    //        var circleMesh = new THREE.Mesh( new THREE.CircleGeometry( wviz.settings.drop.radius, 8 ), surfaceMaterial );
    //        var projMat = new THREE.Matrix4();
    //        projMat.set(1,0,0,0,
    //                    0,1,0,0,
    //                    0,0,0,wviz.settings.terrain.latticeZ,
    //                    0,0,0,1);
    //        var circleProjObj = new THREE.Object3D();
    //        circleProjObj.matrixAutoUpdate = false;
    //        circleProjObj.matrix = projMat;
    //        circleProjObj.add(circleMesh);

    //        //var circleMesh = new THREE.Mesh( new THREE.CircleGeometry( 1, 8 ), new THREE.MeshBasicMaterial( { color: 0x0000ff } ) );
    //        var circleContainer = new THREE.Object3D();
    //        container.add(circleContainer);
    //        circleContainer.add(circleMesh);
    //
    //        circleContainer.matrixAutoUpdate = false;
    //        circleContainer.applyMatrix(p);

}

function advanceOnce(a) {
    if (state.drop.ij) {
        if (typeof(a)==="undefined") { a = 1; }
        while (a-- > 0) {
            var nextIJ = state.m.flow[state.drop.ij[0]][state.drop.ij[1]];
            if (nextIJ) {
                state.drop.moveToIJ(nextIJ[0], nextIJ[1]);
                requestRender();
            }
        }
    }
}

function advanceAll(a) {
    if (state.drop.ij) {
        function oneStep() {
            var nextIJ = state.m.flow[state.drop.ij[0]][state.drop.ij[1]];
            if (nextIJ) {
                state.drop.moveToIJ(nextIJ[0], nextIJ[1]);
                requestRender(function() {
                    setTimeout(oneStep, wviz.settings.drop.fallSpeed);
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

function toggleHeightLines() {
    if (state.heightLines) {
        state.world.remove(state.heightLines);
        state.heightLines = null;
    } else {
        state.heightLines = makeNeighborHeightLines();
        state.world.add(state.heightLines);
    }
    requestRender();
}

function toggleText() {
    if (state.text) {
        state.world.remove(state.text);
        state.text = null;
    } else {
        state.text = makeNeighborText();
        state.world.add(state.text);
    }
    requestRender();
}

function toggleDropScale() {
    if (state.mouseWheelMode === "scale") {
        state.mouseWheelMode = "dropScale";
    } else {
        state.mouseWheelMode = "scale";
    }
}


function createCamera(width, height) {
    var camera = new THREE.PerspectiveCamera( wviz.settings.camera.fov,
                                              width / height, 0.1, 1000 );
    camera.matrixAutoUpdate = false;

    camera.position.set(wviz.settings.camera.position[0],
                        wviz.settings.camera.position[1],
                        wviz.settings.camera.position[2]);
    camera.up.set(wviz.settings.camera.up[0],
                  wviz.settings.camera.up[1],
                  wviz.settings.camera.up[2]);
    camera.lookAt(new THREE.Vector3(wviz.settings.camera.lookAt[0],
                                    wviz.settings.camera.lookAt[1],
                                    wviz.settings.camera.lookAt[2]));

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

function neighborIJPoints(ij) {
    if (!ij) { return null; }
    var i = ij[0];
    var j = ij[1];
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
    return points;
}

function makeNeighborPoints() {
    var points = neighborIJPoints(state.drop.ij);
    if (points === null) { return null; }

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
    var neighbors = new THREE.Object3D();
    points.forEach(function(point) {
        var xy = state.m.ij_to_xy(point);
        var next = state.m.flow[state.drop.ij[0]][state.drop.ij[1]];
        var mat = (point[0]===next[0] && point[1]===next[1]) ? blueSurfaceMaterial : yellowSurfaceMaterial;
        var mesh = new THREE.Mesh(new THREE.SphereGeometry( wviz.settings.drop.radius/2, 8, 8 ), mat);
        mesh.position.set(xy[0], xy[1], state.m.meshData[point[1]][point[0]]);
        neighbors.add( mesh );
    });
    return neighbors;
}

function makeNeighborHeightLines() {
    var points = neighborIJPoints(state.drop.ij);
    if (points === null) { return null; }

    var yellowLineMat = new THREE.LineBasicMaterial({
        color: 0xffff00,
        linewidth: wviz.settings.terrain.lineWidth
    });
    var blueLineMat = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: wviz.settings.terrain.lineWidth
    });

    var yellowLineGeom = new THREE.Geometry();
    var blueLineGeom = new THREE.Geometry();
    var yellowObj = new THREE.LineSegments(yellowLineGeom, yellowLineMat);
    var blueObj = new THREE.LineSegments(blueLineGeom, blueLineMat);
    var lines = new THREE.Object3D();
    lines.add(yellowObj);
    lines.add(blueObj);
    points.forEach(function(point) {
        var xy = state.m.ij_to_xy(point);
        var p0 = new THREE.Vector3(xy[0], xy[1], wviz.settings.terrain.latticeZ);
        var p1 = new THREE.Vector3(xy[0], xy[1], state.m.meshData[point[1]][point[0]]);
        var next = state.m.flow[state.drop.ij[0]][state.drop.ij[1]];
        if (point[0]===next[0] && point[1]===next[1]) {
            blueLineGeom.vertices.push(p0, p1);
        } else {
            yellowLineGeom.vertices.push(p0, p1);
        }
    });
    return lines;
}

var fonts = {};

function makeNeighborText() {

    if (!state.drop || !state.drop.ij) { return null; }
    var textObj = new THREE.Object3D();
    var mat = new THREE.MeshPhongMaterial( {
        color: 0x000000,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var textOptions = {
        // font — THREE.Font.
        font: fonts.optimer,
        // size — Float. Size of the text.
        size: 0.01,
        // height — Float. Thickness to extrude text. Default is 50.
        height: 0.0,
        // curveSegments — Integer. Number of points on the curves. Default is 12.
        curveSegments: 2,
        // bevelEnabled — Boolean. Turn on bevel. Default is False.
        // bevelThickness — Float. How deep into text bevel goes. Default is 10.
        bevelThickness: 0,
        // bevelSize — Float. How far from text outline is bevel. Default is 8.
        bevelSize: 0
    };
    var i,j;
    var R = 5;
    for (i=state.drop.ij[0]-R; i<=state.drop.ij[0]+R; ++i) {
        for (j=state.drop.ij[1]-R; j<=state.drop.ij[1]+R; ++j) {
            var xy = state.m.ij_to_xy([i,j]);
            var oneTextObj = new THREE.Object3D();
            var textGeom = new THREE.TextGeometry(sprintf("%.3f", state.m.meshData[j][i]),
                                                  textOptions);
            var textMesh = new THREE.Mesh(textGeom, mat);
            oneTextObj.add(textMesh);
            oneTextObj.position.set(xy[0] + textOptions.size/4,
                                    xy[1] + textOptions.size/4,
                                    wviz.settings.terrain.latticeZ);
            textObj.add(oneTextObj);
        }
    }

    /*
    var textGeom = new THREE.TextGeometry("3.14152", textOptions);
    var textMesh = new THREE.Mesh(textGeom, mat);
    var textObj = new THREE.Object3D();
    textObj.add(textMesh);
*/
    return textObj;
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
        var mesh = new THREE.Mesh(new THREE.SphereGeometry( wviz.settings.drop.radius/2, 8, 8 ), redSurfaceMaterial);
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
        var mesh = new THREE.Mesh(new THREE.SphereGeometry( wviz.settings.drop.radius/2, 8, 8 ), redSurfaceMaterial);
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
    renderer.setClearColor(wviz.settings.backgroundColor, 1);

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
    wviz.settings.lights.point.forEach(function(lt) {
        var light = new THREE.PointLight( lt.color, lt.intensity, lt.distance, lt.decay );
        light.position.set(lt.position[0], lt.position[1], lt.position[2]);
        scene.add( light );
    });

    function render() {
        var T = new THREE.Matrix4().makeTranslation(0, 0, wviz.settings.terrain.edgeZNudge);
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

    //var m = null;
    var loader = new THREE.FontLoader();
    loader.load( './libs/threejs/fonts/optimer_regular.typeface.json', function ( font ) {
        fonts.optimer = font;
        //world.add( makeNeighborText() );
        //requestRender();
        terrain.load('./data/dem3.mesh', wviz.settings, function(t) {
            state.m = t.m;
            state.faces = t.faces;
            world.add(t.faces);
            zNudgedEdges.add(t.edges);
            state.edges = t.edges;
            world.add(t.lattice);
            state.lattice = t.lattice;
            //var lows = lowPoints2();
            //world.add(lows);
            state.drop = makeDrop(state.m);
            world.add( state.drop.tobj );

            wviz.permalink = Permalink(URL({url: window.location.toString()}));
            wviz.updatePermalink = function() {
                window.history.replaceState({}, "", wviz.permalink.toString());
            };
            if (wviz.permalink.haveMM()) {
                wviz.setMM(wviz.permalink.getMM());
            }
            if (wviz.permalink.haveCenter()) {
                wviz.setCenter(wviz.permalink.getCenter());
            }
            if (wviz.permalink.haveEdges()) {
                wviz.setEdges(wviz.permalink.getEdges());
            }
            if (wviz.permalink.haveFaces()) {
                wviz.setFaces(wviz.permalink.getFaces());
            }
            if (wviz.permalink.haveAxes()) {
                wviz.setAxes(wviz.permalink.getAxes());
            }
            if (wviz.permalink.haveLattice()) {
                wviz.setLattice(wviz.permalink.getLattice());
            }
            if (wviz.permalink.haveIJ()) {
                wviz.setIJ(wviz.permalink.getIJ());
            }
            //wviz.permalink.setZoom(wviz.map.getZoom());
            //window.history.replaceState({}, "", wviz.permalink.toString());

            requestRender();
        });

    });

/*
*/



//     function makeDrop() {
//         //var geometry = new THREE.SphereGeometry( wviz.settings.drop.radius, 16, 16 );
//         var geometry = new THREE.SphereGeometry( 1, 16, 16 );
//         var surfaceMaterial = new THREE.MeshPhongMaterial({
//             color: 0x3333ff,
//             side: THREE.DoubleSide,
//             shading: THREE.SmoothShading
//         });
//         var wireMaterial = new THREE.MeshBasicMaterial({
//             color: 0x000000,
//             wireframe: true,
//             wireframeLinewidth: 2
//         });
//         var sphere = new THREE.Object3D();
//         //sphere.visible = false;
//         sphere.add( new THREE.Mesh( geometry, surfaceMaterial ) );
//         var container = new THREE.Object3D();
//         container.add(sphere);
//         container.visible = false;
// 
//         container.scale.set(wviz.settings.drop.radius,
//                             wviz.settings.drop.radius,
//                             wviz.settings.drop.radius);
// 
// 
//         var p = new THREE.Matrix4();
//         p.set(1,0,0,0,
//               0,1,0,0,
//               0,0,0,wviz.settings.terrain.latticeZ,
//               0,0,0,1);
//         //var circleMesh = new THREE.Mesh( new THREE.CircleGeometry( 1, 8 ), new THREE.MeshBasicMaterial( { color: 0x0000ff } ) );
//         var circleMesh = new THREE.Mesh( new THREE.CircleGeometry( 1, 8 ), surfaceMaterial );
//         var circleContainer = new THREE.Object3D();
//         container.add(circleContainer);
//         circleContainer.add(circleMesh);
// //debug.showMatrix('0 circleContainer mat', circleContainer.matrix);
//         circleContainer.matrixAutoUpdate = false;
//         circleContainer.applyMatrix(p);
// //debug.showMatrix('1 circleContainer mat', circleContainer.matrix);
// 
//         return container;
//     }






/*
    (function() {
        var geometry = new THREE.CircleGeometry( 1, 8 );
        var material = new THREE.MeshBasicMaterial( { color: 0x0000ff } );
        var circle = new THREE.Mesh( geometry, material );
        world.add( circle );
    }());
*/

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
//            if (iobj.object === state.faces) {
            if (iobj.object === state.faces
                ||
                iobj.object === state.lattice) {
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

    wviz.setMM = function(m) {
        moving.matrix.copy(m);
        moving.matrixWorldNeedsUpdate = true;
    };
    wviz.setCenter = function(c) {
        center.position.set(c[0], c[1], c[2]);
    };

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
                wviz.permalink.setMM(moving.matrix);
                wviz.updatePermalink();
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
                        state.drop.moveToIJ(ij[0], ij[1]);
                        requestRender();
                    });
                }
                if (event.ctrlKey && event.button === 0) {
                    // ctrl-left-click event
                    console.log(sprintf("center at (%f,%f)", p.x, p.y));
                    //pick(p.x, p.y);
                    pick(p.x, p.y, function(x,y,z) {
                        wviz.setCenter([x,y,z]);
                        wviz.permalink.setCenter([x,y,z]);
                        wviz.updatePermalink();
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
                wviz.permalink.setMM(moving.matrix);
                wviz.updatePermalink();
                moving.matrixWorldNeedsUpdate = true;
                requestRender();
            } else if (state.mouseWheelMode === "dropScale") {
                s = Math.exp(delta/20.0);
                wviz.settings.drop.radius *= s;
                state.drop.setRadius(wviz.settings.drop.radius);
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

function parseMatrix4(str) {
    var m = new THREE.Matrix4();
    var e = str.split(/,/).map(function(s) { return parseFloat(s); });
    m.set(e[0], e[1], e[2], e[3],
          e[4], e[5], e[6], e[7],
          e[8], e[9], e[10], e[11],
          e[12], e[13], e[14], e[15]);
    return m;
}

function matrix4ToString(m) {
    var e = m.elements;
    return sprintf("%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f",
                   e[0],e[4],e[ 8],e[12],
                   e[1],e[5],e[ 9],e[13],
                   e[2],e[6],e[10],e[14],
                   e[3],e[7],e[11],e[15]);
}

function parseFloatArray(str) {
    return str.split(/,/).map(function(s) { return parseFloat(s); });
}

function floatArrayToString(a) {
    return a.map(function(x) { return sprintf("%.4f", x); }).join(",");
}

function parseIntArray(str) {
    return str.split(/,/).map(function(s) { return parseInt(s,10); });
}

function intArrayToString(a) {
    return a.map(function(x) { return sprintf("%1d", x); }).join(",");
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

// A utility object for constructing and extracting information from the
// application URL:
function Permalink(url) {
    var mm = null, c = null, ae = null, af = null, ac = null, al = null, ij = null;
    if ('mm' in url.params) {
        mm = parseMatrix4(url.params.mm);
    }
    if ('c' in url.params) {
        c = parseFloatArray(url.params.c);
    }
    if ('ae' in url.params) {
        ae = parseBoolean(url.params.ae);
    }
    if ('af' in url.params) {
        af = parseBoolean(url.params.af);
    }
    if ('ac' in url.params) {
        ac = parseBoolean(url.params.ac);
    }
    if ('al' in url.params) {
        al = parseBoolean(url.params.al);
    }
    if ('ij' in url.params) {
        ij = parseIntArray(url.params.ij);
    }
    return {
        toString : function() { return url.toString(); },
        haveMM: function() { return mm !== null; },
        getMM: function() { return mm; },
        setMM: function(m) {
            if (!mm) { mm = new THREE.Matrix4(); }
            mm.copy(m);
            url.params.mm = matrix4ToString(mm);
        },
        haveCenter: function() { return c !== null; },
        getCenter: function() { return c; },
        setCenter: function(a) {
            if (c === null) { c = [0,0,0]; }
            var i;
            for (i=0; i<3; ++i) { c[i] = a[i]; }
            url.params.c = floatArrayToString(a);
        },

        haveEdges: function() { return ae !== null; },
        getEdges: function() { return ae; },
        setEdges: function(v) {
            ae = parseBoolean(v);
            url.params.ae = booleanToString(ae);
        },

        haveFaces: function() { return af !== null; },
        getFaces: function() { return af; },
        setFaces: function(v) {
            af = parseBoolean(v);
            url.params.af = booleanToString(af);
        },

        haveAxes: function() { return ac !== null; },
        getAxes: function() { return ac; },
        setAxes: function(v) {
            ac = parseBoolean(v);
            url.params.ac = booleanToString(ac);
        },

        haveLattice: function() { return al !== null; },
        getLattice: function() { return al; },
        setLattice: function(v) {
            al = parseBoolean(v);
            url.params.al = booleanToString(al);
        },

        haveIJ: function() { return ij !== null; },
        getIJ: function() { return ij; },
        setIJ: function(v) {
            ij = [v[0],v[1]];
            url.params.ij = intArrayToString(ij);
        }


    };
}

$(document).ready(function() {
    var $canvas = $('#thecanvas');
    var width = $canvas.width();
    var height = $canvas.height();
    var canvas = $canvas[0];
    launch(canvas, width, height);
});
