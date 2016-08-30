require('./style.css');
var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var EventTracker = require('./EventTracker.js');
var terrain = require('./terrain.js');
var rain = require('./rain.js');
var URL = require('./url.js');
var event_emitter = require('./event_emitter.js');

var ttest = require('./ttest.js');

window.debug = require('./debug.js');

var wviz = {};

event_emitter(wviz);

wviz.settings = {
    //backgroundColor: 0x555555,
    //backgroundColor: 0x7ec0ee,
    backgroundColor: 0xffffff,
    terrain: {
        diffuseColor: 0x88ff88,
        edgeColor: 0x000000,
        lineWidth: 1,
        edgeZNudge: 0.01,
        //latticeZ: -2,
        latticeZ: -0.5,
        latticeColor: 0x000000
    },
    lights: {
        point: [
//            { position: [ 0,  0, 10], color: 0xffffff, intensity: 0.6, distance: 0, decay: 1 },
//            { position: [10,  0,  0], color: 0xffffff, intensity: 0.6, distance: 0, decay: 1 },
//            { position: [ 0, 10,  0], color: 0xffffff, intensity: 0.6, distance: 0, decay: 1 }
        ],
        directional: [
            { position: [ 0,  0, 10], color: 0xffffff, intensity: 0.4 },
            { position: [10,  0,  0], color: 0xffffff, intensity: 0.4 },
            { position: [ 0, 10,  0], color: 0xffffff, intensity: 0.4 }
        ]
    },
    camera: {
        fov: 45,
        position: [1,-15,15],
        near: 0.1,
        far: 1000,
// for essentially orthographic projection, use the following:
//        fov: 0.1,
//        position: [0,0,1000],
//        near: 0.1,
//        far: 10000,
        up: [0,1,0],
        lookAt: [0,0,0]
    },
    drop: {
        radius: 0.1,
        fallSpeed: 100
    }
};


window.wviz = wviz;

wviz.setEdges = function(v) {
    if (wviz.edges) {
        wviz.edges.visible = v;
    }
};
wviz.setFaces = function(v) {
    if (wviz.faces) {
        wviz.faces.visible = v;
    }
};
wviz.setAxes = function(v) {
    if (wviz.axes) {
        wviz.axes.visible = v;
    }
};
wviz.setLattice = function(v) {
    if (wviz.lattice) {
        wviz.lattice.visible = v;
    }
};
wviz.setLatticeArrows = function(v) {
    if (wviz.latticeArrows) {
        wviz.latticeArrows.visible = v;
    }
};
wviz.setIJ = function(ij) {
    if (ij) {
        wviz.drop.moveToIJ(ij[0], ij[1]);
    }
};

wviz.set2D = function(v) {
    if (wviz.d2) {
        wviz.d2.visible = v;
    }
};
wviz.set3D = function(v) {
    if (wviz.d3) {
        wviz.d3.visible = v;
    }
};

wviz.setLineWidth = function(a) {
    if (a !== null) {
        wviz.edges.material.linewidth = a;
        wviz.lattice.material.linewidth = a;
        //wviz.latticeArrows.material.linewidth = a;
    }
};

wviz.setFallSpeed = function(n) {
    wviz.settings.drop.fallSpeed = n;
};

function makeDrop(m) {
    var geometry = new THREE.SphereGeometry( 1, 16, 16 );
    var sphereDropMat = new THREE.MeshPhongMaterial({
        color: 0x3333ff,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var flatDropMat = new THREE.MeshBasicMaterial({
        color: 0x3333ff,
        side: THREE.DoubleSide
    });
    var sphereScaleObj = new THREE.Object3D();
    sphereScaleObj.scale.set(wviz.settings.drop.radius,
                             wviz.settings.drop.radius,
                             wviz.settings.drop.radius);
    sphereScaleObj.add( new THREE.Mesh( geometry, sphereDropMat ) );
    var spherePositionObj = new THREE.Object3D();
    spherePositionObj.add(sphereScaleObj);
    spherePositionObj.visible = false;

    function addCircle(geom,x,y,r,n,z) {
        var a = Math.PI/4;
        var da = 2*Math.PI/n;
        var ps = [];
        var i;
        var k = geom.vertices.length;
        for (i=0; i<n; ++i) {
            geom.vertices.push(new THREE.Vector3(x+r*Math.cos(a),y+r*Math.sin(a),z));
            a += da;
            geom.vertices.push(new THREE.Vector3(x+r*Math.cos(a),y+r*Math.sin(a),z));
        }
    }

    function addAnnulus(geom,x,y,r0,r1,n,z) {
        var a = Math.PI/4;
        var da = 2*Math.PI/n;
        var ps = [];
        var i;
        var k = geom.vertices.length;
        var n2 = 2*n;
        for (i=0; i<n; ++i) {
            geom.vertices.push(new THREE.Vector3(x+r0*Math.cos(a),y+r0*Math.sin(a),z));
            geom.vertices.push(new THREE.Vector3(x+r1*Math.cos(a),y+r1*Math.sin(a),z));
            a += da;
            geom.faces.push(new THREE.Face3((k  )%n2, (k+1)%n2, (k+2)%n2),
                            new THREE.Face3((k+2)%n2, (k+1)%n2, (k+3)%n2));
            k += 2;
        }
    }

    var circleLineMat = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 8
    });
    var circlePositionObj = new THREE.Object3D();
    var circleGeom = new THREE.Geometry();
    addAnnulus(circleGeom, 0, 0, 0.015, 0.035, 12, 0);
    var circleScaleObj = new THREE.Mesh(circleGeom, flatDropMat);
    circlePositionObj.add(circleScaleObj);
    circlePositionObj.visible = false;

    var terrainDropObj = new THREE.Object3D();
    terrainDropObj.add(spherePositionObj);
    var flatDropObj = new THREE.Object3D();
    flatDropObj.add(circlePositionObj);

    var trailMat = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 4
    });
    var terrainTrailObj = new THREE.Object3D();
    var flatTrailObj = new THREE.Object3D();
    var terrainTrailTObj = new THREE.Object3D();
    var flatTrailTObj = new THREE.Object3D();
    terrainTrailTObj.add(terrainTrailObj);
    flatTrailTObj.add(flatTrailObj);
    var lastTrailPoint = null;
    return {
        terrainDropObj: terrainDropObj,
        flatDropObj: flatDropObj,
        terrainTrailTObj: terrainTrailTObj,
        flatTrailTObj: flatTrailTObj,
        ij: null,
        moveToIJ: function(i,j) {
            var xy = m.ij_to_xy([i,j]);
            var x = xy[0];
            var y = xy[1];
            var z = m.meshData[j][i]+wviz.settings.drop.radius;
            wviz.drop.ij = [i,j];
            this.ij = [i,j];
            spherePositionObj.visible = true;
            spherePositionObj.position.set(x,y,z);
            circlePositionObj.visible = true;
            circlePositionObj.position.set(x,y,wviz.settings.terrain.latticeZ-0.001);
            var flatTrailZ = wviz.settings.terrain.latticeZ-0.001;
            if (lastTrailPoint) {
                var terrainTrailGeom = new THREE.Geometry();
                var flatTrailGeom = new THREE.Geometry();
                terrainTrailGeom.vertices.push(new THREE.Vector3(lastTrailPoint[0],
                                                                 lastTrailPoint[1],
                                                                 lastTrailPoint[2]));
                terrainTrailGeom.vertices.push(new THREE.Vector3(x, y, m.meshData[j][i]));
                terrainTrailObj.add(new THREE.LineSegments(terrainTrailGeom, trailMat));
                flatTrailGeom.vertices.push(new THREE.Vector3(lastTrailPoint[0],
                                                              lastTrailPoint[1],
                                                              flatTrailZ));
                flatTrailGeom.vertices.push(new THREE.Vector3(x, y, flatTrailZ));
                flatTrailObj.add(new THREE.LineSegments(flatTrailGeom, trailMat));
            }
            lastTrailPoint = [x,y,m.meshData[j][i]];
            wviz.emit({type: "ijset", ij: [i,j]});
        },
        moveDropToXYZ: function (x,y,z) {
            spherePositionObj.visible = true;
            spherePositionObj.position.set(x,y,z);
            circlePositionObj.visible = true;
            circlePositionObj.position.set(x,y,wviz.settings.terrain.latticeZ);
        },
        setRadius: function(r) {
            sphereScaleObj.scale.set(r,r,r);
            //circleScaleObj.scale.set(r,r,r);
        },
        clearTrail: function() {
            terrainTrailTObj.remove(terrainTrailObj);
            flatTrailTObj.remove(flatTrailObj);
            terrainTrailObj = new THREE.Object3D();
            flatTrailObj = new THREE.Object3D();
            terrainTrailTObj.add(terrainTrailObj);
            flatTrailTObj.add(flatTrailObj);
            lastTrailPoint = null;
        }
    };
}

wviz.advanceOnce = function(a) {
    if (wviz.drop.ij) {
        if (typeof(a)==="undefined") { a = 1; }
        while (a-- > 0) {
            var nextIJ = wviz.m.flow[wviz.drop.ij[0]][wviz.drop.ij[1]];
            if (nextIJ) {
                wviz.drop.moveToIJ(nextIJ[0], nextIJ[1]);
                wviz.requestRender();
            }
        }
    }
};

wviz.advanceAll = function(a) {
    if (wviz.drop.ij) {
        function oneStep() {
            var nextIJ = wviz.m.flow[wviz.drop.ij[0]][wviz.drop.ij[1]];
            if (nextIJ) {
                wviz.drop.moveToIJ(nextIJ[0], nextIJ[1]);
                wviz.requestRender(function() {
                    setTimeout(oneStep, wviz.settings.drop.fallSpeed);
                });
            }
        }
        oneStep();
    }
}

wviz.showNeighbors = function() {
    wviz.hideNeighbors();
    wviz.neighbors = makeNeighborPoints();
    wviz.d3.add(wviz.neighbors);
    wviz.requestRender();
};

wviz.hideNeighbors = function() {
    if (wviz.neighbors) {
        wviz.d3.remove(wviz.neighbors);
    }
    wviz.neighbors = null;
    wviz.requestRender();
};

wviz.showHeightLines = function() {
    wviz.hideHeightLines();
    wviz.heightLines = makeNeighborHeightLines();
    wviz.d3.add(wviz.heightLines);
    wviz.requestRender();
};

wviz.hideHeightLines = function() {
    if (wviz.heightLines) {
        wviz.d3.remove(wviz.heightLines);
    }
    wviz.heightLines = null;
    wviz.requestRender();
};

wviz.showText = function() {
    wviz.hideText();
    wviz.text = makeNeighborText();
    wviz.d2.add(wviz.text);
    wviz.requestRender();
};

wviz.hideText = function() {
    if (wviz.text) {
        wviz.d2.remove(wviz.text);
    }
    wviz.text = null;
    wviz.requestRender();
};

function createCamera(width, height) {
    var camera = new THREE.PerspectiveCamera( wviz.settings.camera.fov,
                                              width / height,
                                              wviz.settings.camera.near,
                                              wviz.settings.camera.far);
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

function neighborIJPoints(ij, includeSelf) {
    if (!ij) { return null; }
    var i = ij[0];
    var j = ij[1];
    var ii, jj;
    var points = [];
    for (ii=i-1; ii<=i+1; ++ii) {
        for (jj=j-1; jj<=j+1; ++jj) {
            if ((ii!==i || jj!==j || includeSelf)
                && ii >= 0 && ii < wviz.m.N
                && jj >= 0 && jj < wviz.m.M) {
                points.push([ii,jj]);
                //var xy = wviz.m.ij_to_xy([ii,jj]);
                //points.push([xy[0], xy[1], wviz.m.meshData[jj][ii]]);
            }
        }
    }
    return points;
}

function makeNeighborPoints() {
    var points = neighborIJPoints(wviz.drop.ij);
    if (points === null) { return null; }

    var defaultSurfaceMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var nextSurfaceMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var neighbors = new THREE.Object3D();
    points.forEach(function(point) {
        var xy = wviz.m.ij_to_xy(point);
        var next = wviz.m.flow[wviz.drop.ij[0]][wviz.drop.ij[1]];
        var mat = (point[0]===next[0] && point[1]===next[1]) ? nextSurfaceMaterial : defaultSurfaceMaterial;
        var sph = new THREE.SphereGeometry( wviz.settings.drop.radius/2, 8, 8 );
        var mesh = new THREE.Mesh(sph, mat);
        mesh.position.set(xy[0], xy[1], wviz.m.meshData[point[1]][point[0]]);
        neighbors.add( mesh );
    });
    return neighbors;
}

function makeNeighborHeightLines() {
    var points = neighborIJPoints(wviz.drop.ij, true);
    if (points === null) { return null; }

    var defaultLineMat = new THREE.LineBasicMaterial({
        color: 0x000000,
        linewidth: 3
    });
    var currentLineMat = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 3
    });
    var nextLineMat = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 3
    });

    var defaultLineGeom = new THREE.Geometry();
    var currentLineGeom = new THREE.Geometry();
    var nextLineGeom = new THREE.Geometry();
    var defaultObj = new THREE.LineSegments(defaultLineGeom, defaultLineMat);
    var currentObj = new THREE.LineSegments(currentLineGeom, currentLineMat);
    var nextObj = new THREE.LineSegments(nextLineGeom, nextLineMat);
    var lines = new THREE.Object3D();
    lines.add(defaultObj);
    lines.add(currentObj);
    lines.add(nextObj);
    points.forEach(function(point) {
        var xy = wviz.m.ij_to_xy(point);
        var p0 = new THREE.Vector3(xy[0], xy[1], wviz.settings.terrain.latticeZ);
        var p1 = new THREE.Vector3(xy[0], xy[1], wviz.m.meshData[point[1]][point[0]]);
        var next = wviz.m.flow[wviz.drop.ij[0]][wviz.drop.ij[1]];
        if (point[0]===next[0] && point[1]===next[1]) {
            nextLineGeom.vertices.push(p0, p1);
        } else if (point[0]===wviz.drop.ij[0] && point[1]===wviz.drop.ij[1]) {
            currentLineGeom.vertices.push(p0, p1);
        } else {
            defaultLineGeom.vertices.push(p0, p1);
        }
    });
    return lines;
}

var fonts = {};

function makeNeighborText() {

    if (!wviz.drop || !wviz.drop.ij) { return null; }
    var textObj = new THREE.Object3D();
    var mat = new THREE.MeshBasicMaterial( {
        color: 0x000000
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
    for (i=wviz.drop.ij[0]-R; i<=wviz.drop.ij[0]+R; ++i) {
        for (j=wviz.drop.ij[1]-R; j<=wviz.drop.ij[1]+R; ++j) {
            if (wviz.m.inRange([i,j])) {
                var xy = wviz.m.ij_to_xy([i,j]);
                var oneTextObj = new THREE.Object3D();
                var textGeom = new THREE.TextGeometry(sprintf("%.3f", wviz.m.meshData[j][i]),
                                                      textOptions);
                var textMesh = new THREE.Mesh(textGeom, mat);
                oneTextObj.add(textMesh);
                oneTextObj.position.set(xy[0] + textOptions.size,
                                        xy[1] + textOptions.size,
                                        wviz.settings.terrain.latticeZ);
                textObj.add(oneTextObj);
            }
        }
    }
    return textObj;
}

function latticeDistance([i0,j0],[i1,j1]) {
    return Math.max(Math.abs(i0-i1), Math.abs(j0-j1));
}

function lowPoints() {
    var i, j;
    var points = [];
    var segsGeom = new THREE.Geometry();
    for (i=0; i<wviz.m.N; ++i) {
        for (j=0; j<wviz.m.M; ++j) {
            var next = wviz.m.flow[i][j];
            if (next != null && latticeDistance([i,j],next) > 1) {
                var xy = wviz.m.ij_to_xy([i,j]);
                points.push([xy[0], xy[1], wviz.m.meshData[j][i]]);
                segsGeom.vertices.push(new THREE.Vector3(xy[0], xy[1], wviz.m.meshData[j][i]));
                var nxy = wviz.m.ij_to_xy(next);
                segsGeom.vertices.push(new THREE.Vector3(nxy[0], nxy[1], wviz.m.meshData[next[1]][next[0]]));
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
    wviz.m.lowPoints.forEach(function(ij) {
        var xy = wviz.m.ij_to_xy([ij[0], ij[1]]);
        var mesh = new THREE.Mesh(new THREE.SphereGeometry( wviz.settings.drop.radius/2, 8, 8 ), redSurfaceMaterial);
        mesh.position.set(xy[0], xy[1], wviz.m.meshData[ij[1]][ij[0]]);
        lows.add( mesh );
    });
    return lows;
}

wviz.launch = function(canvas, width, height, commands) {

    var renderer = new THREE.WebGLRenderer({
        canvas: canvas
    });
    renderer.setSize( width, height );
    renderer.setClearColor(wviz.settings.backgroundColor, 1);

    var camera = createCamera(width, height);
    wviz.camera = camera;
    wviz.world = new THREE.Object3D();
    wviz.d3 = new THREE.Object3D();
    wviz.d2 = new THREE.Object3D();
    wviz.world.add(wviz.d2);
    wviz.world.add(wviz.d3);
    var zNudged3DEdges = new THREE.Object3D();
    var zNudged2DEdges = new THREE.Object3D();
    wviz.world.matrixAutoUpdate = false;
    zNudged3DEdges.matrixAutoUpdate = false;
    zNudged2DEdges.matrixAutoUpdate = false;
    wviz.d3.add(zNudged3DEdges);
    wviz.d2.add(zNudged2DEdges);
    wviz.axes = axes3D({
        length: 0.75,
        tipRadius: 0.05,
        tipHeight: 0.3
    });
    wviz.d3.add(wviz.axes);
    var scene = new THREE.Scene();
    var worldContainer = new THREE.Object3D();
    worldContainer.add( wviz.world );
    scene.add( camera );
    scene.add( worldContainer );
    scene.add( new THREE.AmbientLight( 0x222222 ) );
    wviz.settings.lights.point.forEach(function(lt) {
        var light = new THREE.PointLight( lt.color, lt.intensity, lt.distance, lt.decay );
        light.position.set(lt.position[0], lt.position[1], lt.position[2]);
        scene.add( light );
    });
    wviz.settings.lights.directional.forEach(function(lt) {
        var light = new THREE.DirectionalLight( lt.color, lt.intensity );
        light.position.set(lt.position[0], lt.position[1], lt.position[2]);
        scene.add( light );
    });

    function render() {
        var T = new THREE.Matrix4().makeTranslation(0, 0, wviz.settings.terrain.edgeZNudge);
        zNudged3DEdges.matrix = EventTracker.computeTransform(zNudged3DEdges,camera,camera, T);
        zNudged3DEdges.matrixWorldNeedsUpdate = true;
        zNudged2DEdges.matrix = EventTracker.computeTransform(zNudged2DEdges,camera,camera, T);
        zNudged2DEdges.matrixWorldNeedsUpdate = true;
        renderer.render( scene, camera );
    };

    wviz.requestRender = function(f) {
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
/*
    //var m = null;
    var loader = new THREE.FontLoader();
    loader.load( './libs/threejs/fonts/optimer_regular.typeface.json', function ( font ) {
        fonts.optimer = font;
        //world.add( makeNeighborText() );
        //wviz.requestRender();
        terrain.load('./data/dem3.mesh', wviz.settings, function(t) {
            wviz.m = t.m;
            wviz.faces = t.faces;
            wviz.d3.add(t.faces);
            zNudged3DEdges.add(t.edges);
            wviz.edges = t.edges;
            wviz.d2.add(t.lattice);
            wviz.lattice = t.lattice;
            wviz.d2.add(t.latticeArrows);
            wviz.latticeArrows = t.latticeArrows;

            wviz.d2.add(t.latticeQuad);
            wviz.latticeQuad = t.latticeQuad;

            wviz.drop = makeDrop(wviz.m);
            wviz.d3.add( wviz.drop.terrainDropObj );
            wviz.d2.add( wviz.drop.flatDropObj );
            zNudged3DEdges.add(wviz.drop.terrainTrailTObj);
            zNudged2DEdges.add(wviz.drop.flatTrailTObj);
            wviz.emit({type: "launched"});
            wviz.requestRender();
        });

    });
*/
{
    wviz.emit({type: "launched"});
    ttest.ttest(wviz);
    wviz.requestRender();
}

    var raycaster = new THREE.Raycaster();

    wviz.pick = function(x,y,callback) {
        var mouse = new THREE.Vector2();
        mouse.x = ( x / window.innerWidth ) * 2 - 1;
        mouse.y = - ( y / window.innerHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObjects( scene.children, true );
        var minDist = 999999;
        var minObj = null;
        intersects.forEach(function(iobj) {
            if (iobj.object === wviz.faces
                ||
                iobj.object === wviz.latticeQuad) {
                if (iobj.distance < minDist) {
                    minDist = iobj.distance;
                    minObj = iobj;
                }
            }
        });
        if (minObj) {
            var Tw = wviz.world.matrixWorld;
            var TwInv = new THREE.Matrix4();    
            TwInv.getInverse(Tw);
            var p = new THREE.Vector4(minObj.point.x,minObj.point.y,minObj.point.z,1);
            p.applyMatrix4(TwInv);
            callback(p.x/p.w, p.y/p.w, p.z/p.w);
        }
    };

};

module.exports = wviz;
