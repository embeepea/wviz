var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var EventTracker = require('./EventTracker.js');
var event_emitter = require('./event_emitter.js');
var axes = require('./axes.js');
var terrain = require('./terrain.js');
var upstream = require('./upstream.js');

var wviz = {};
window.wviz = wviz;

var baseZ = -0.5;
wviz.settings = {
    backgroundColor: 0xffffff,
    edgeZNudge: 0.05,
    terrain: {
        edgeLineWidth: 2,
        //txSize: 1024,
        txSize: 2048,
        txBackgroundColor: "rgba(136,255,136,0.1)",
        baseZLevel0: baseZ+0,     // baseFace
        baseZLevel1: baseZ+0.001, // yellow dot
        baseZLevel2: baseZ+0.002, // blue dot
        baseZLevel3: baseZ+0.003, // dots & arrows
        baseZLevel4: baseZ+0.004 // text
    },
    lights: {
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
        radius: 0.05,
        fallSpeed: 100,
        trailColor: "#0000ff",
        trailLineWidth: 8
    }
};

event_emitter(wviz);

function txClear(ctx) {
    ctx.clear();
    ctx.fillStyle(wviz.settings.terrain.txBackgroundColor);
    ctx.fillRect(-10,-10,20,20);
};

function txDrawGridPoints(ctx) {
    var u,v,xy;
    ctx.fillStyle("#000000");
    for (u=0; u<wviz.m.Nu; ++u) {
        for (v=0; v<wviz.m.Nv; ++v) {
            xy = wviz.m.uv_to_xy([u,v]);
            ctx.beginPath();
            ctx.arc(xy[0],xy[1],0.01, 0,2*Math.PI);
            ctx.fill();
        }
    }
};

function txDrawGridLines(ctx) {
    var m = wviz.m;
    ctx.strokeStyle("#000000");
    ctx.lineWidth(0.05);
    var u, v, xy;
    for (v=0; v<m.Nv; ++v) {
        xy = m.uv_to_xy([0,v]);
        ctx.moveTo(xy[0],xy[1]);
        for (u=1; u<m.Nu; ++u) {
            xy = m.uv_to_xy([u,v]);
            ctx.lineTo(xy[0],xy[1]);
        }
    }
    for (u=0; u<m.Nu; ++u) {
        xy = m.uv_to_xy([u,0]);
        ctx.moveTo(xy[0],xy[1]);
        for (v=1; v<m.Nv; ++v) {
            xy = m.uv_to_xy([u,v]);
            ctx.lineTo(xy[0],xy[1]);
        }
    }
    ctx.stroke();
};

wviz._visible = {
    terrainEdges: true,
    terrainFaces: true,
    terrainEdges: true,
    baseFaces: true,
    basePoints: false,
    baseArrows: false,
    d3: true,
    d2: false,
    axes: false
};

function renderTexture() {
    txClear(wviz.terrainTextureContext);
    txClear(wviz.flatTextureContext);

    txDrawUpstreamMultiPolygons(wviz.terrainTextureContext);
    txDrawUpstreamMultiPolygons(wviz.flatTextureContext);

    txDrawUpstreamMultiPolygonBoundaries(wviz.terrainTextureContext);
    txDrawUpstreamMultiPolygonBoundaries(wviz.flatTextureContext);

    //if (wviz._visible.gridPoints) {
    //    txDrawGridPoints(wviz.terrainTextureContext);
    //    txDrawGridPoints(wviz.flatTextureContext);
    //}
    //if (wviz._visible.terrainEdges) {
    //    txDrawGridLines(wviz.terrainTextureContext);
    //    txDrawGridLines(wviz.flatTextureContext);
    //}

    //if (wviz.blueDrop && wviz.blueDrop.uv) {
    //    wviz.blueDrop.txRenderTrail(wviz.terrainTextureContext);
    //    wviz.blueDrop.txRenderTrail(wviz.flatTextureContext);
    //}
}

function neighborUVPoints(uv, includeSelf) {
    if (!uv) { return null; }
    var u = uv[0];
    var v = uv[1];
    var uu, vv;
    var points = [];
    for (uu=u-1; uu<=u+1; ++uu) {
        for (vv=v-1; vv<=v+1; ++vv) {
            if ((uu!==u || vv!==v || includeSelf)
                && uu >= 0 && uu < wviz.m.Nu
                && vv >= 0 && vv < wviz.m.Nv) {
                points.push([uu,vv]);
                //var xy = wviz.m.uv_to_xy([uu,vv]);
                //points.push([xy[0], xy[1], wviz.m.meshData[vv][uu]]);
            }
        }
    }
    return points;
}

function makeNeighborPoints() {
    var points = neighborUVPoints(wviz.blueDrop.uv);
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
        var xy = wviz.m.uv_to_xy(point);
        var next = wviz.m.flow[wviz.blueDrop.uv[0]][wviz.blueDrop.uv[1]];
        var mat = (point[0]===next[0] && point[1]===next[1]) ? nextSurfaceMaterial : defaultSurfaceMaterial;
        var sph = new THREE.SphereGeometry( wviz.settings.drop.radius/2, 8, 8 );
        var mesh = new THREE.Mesh(sph, mat);
        mesh.position.set(xy[0], xy[1], wviz.m.meshData[point[0]][point[1]]);
        neighbors.add( mesh );
    });
    return neighbors;
}

function makeNeighborHeightLines() {
    var points = neighborUVPoints(wviz.blueDrop.uv, true);
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
        var xy = wviz.m.uv_to_xy(point);
        var p0 = new THREE.Vector3(xy[0], xy[1], wviz.settings.terrain.baseZLevel0);
        var p1 = new THREE.Vector3(xy[0], xy[1], wviz.m.meshData[point[0]][point[1]]);
        var next = wviz.m.flow[wviz.blueDrop.uv[0]][wviz.blueDrop.uv[1]];
        if (point[0]===next[0] && point[1]===next[1]) {
            nextLineGeom.vertices.push(p0, p1);
        } else if (point[0]===wviz.blueDrop.uv[0] && point[1]===wviz.blueDrop.uv[1]) {
            currentLineGeom.vertices.push(p0, p1);
        } else {
            defaultLineGeom.vertices.push(p0, p1);
        }
    });
    return lines;
}

function makeNeighborText() {
    if (!wviz.blueDrop || !wviz.blueDrop.uv) { return null; }
    var textObj = new THREE.Object3D();
    var mat = new THREE.MeshBasicMaterial( {
        color: 0x000000
    });
    var textOptions = {
        // font — THREE.Font.
        font: wviz.fonts.optimer,
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
    var u,v;
    var R = 5;
    for (u=wviz.blueDrop.uv[0]-R; u<=wviz.blueDrop.uv[0]+R; ++u) {
        for (v=wviz.blueDrop.uv[1]-R; v<=wviz.blueDrop.uv[1]+R; ++v) {
            if (wviz.m.inRange([u,v])) {
                var xy = wviz.m.uv_to_xy([u,v]);
                var oneTextObj = new THREE.Object3D();
                var textGeom = new THREE.TextGeometry(sprintf("%.3f", wviz.m.meshData[u][v]),
                                                      textOptions);
                var textMesh = new THREE.Mesh(textGeom, mat);
                oneTextObj.add(textMesh);
                oneTextObj.position.set(xy[0] + textOptions.size,
                                        xy[1] + textOptions.size,
                                        wviz.settings.terrain.baseZLevel4);
                textObj.add(oneTextObj);
            }
        }
    }
    return textObj;
}

wviz.showNeighborPoints = function() {
    wviz.hideNeighborPoints();
    wviz.neighborPoints = makeNeighborPoints();
    wviz.d3.add(wviz.neighborPoints);
    wviz.requestRender();
};

wviz.hideNeighborPoints = function() {
    if (wviz.neighborPoints) {
        wviz.d3.remove(wviz.neighborPoints);
    }
    wviz.neighborPoints = null;
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

wviz.advanceDropOnce = function(a) {
    if (wviz.blueDrop.uv) {
        if (typeof(a)==="undefined") { a = 1; }
        while (a-- > 0) {
            var nextUV = wviz.m.flow[wviz.blueDrop.uv[0]][wviz.blueDrop.uv[1]];
            if (nextUV) {
                wviz.blueDrop.moveToUV(nextUV[0], nextUV[1]);
                wviz.requestRender();
            }
        }
    }
};

wviz.visible = function(what, v) {
    if (typeof(v) !== "undefined") {
        wviz._visible[what] = v;
        //wviz.textureNeedsRendering = true;
        if (what === "terrainFaces") {
            wviz.terrainFaces.visible = v;
        } else if (what === "terrainEdges") {
            wviz.terrainEdges.visible = v;
        } else if (what === "d3") {
            wviz.d3.visible = v;
        } else if (what === "d2") {
            wviz.d2.visible = v;
        } else if (what === "axes") {
            wviz.axes.visible = v;
        } else if (what === "basePoints") {
            wviz.basePoints.visible = v;
        } else if (what === "baseArrows") {
            wviz.baseArrows.visible = v;
        }
    }
    return wviz._visible[what];
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

function makeDrop(m, options) {
    var geometry = new THREE.SphereGeometry( 1, 16, 16 );
    var sphereDropMat = new THREE.MeshPhongMaterial({
        color: options.terrainDropColor,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var sphereScaleObj = new THREE.Object3D();
    sphereScaleObj.scale.set(options.terrainDropRadius,
                             options.terrainDropRadius,
                             options.terrainDropRadius);
    sphereScaleObj.add( new THREE.Mesh( geometry, sphereDropMat ) );
    var spherePositionObj = new THREE.Object3D();
    spherePositionObj.add(sphereScaleObj);
    spherePositionObj.visible = false;

    var flatDropMat = new THREE.MeshBasicMaterial({
        color: options.flatDropColor,
        side: THREE.DoubleSide
    });

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
        geom.computeFaceNormals();
        geom.computeVertexNormals();
    }

    var circlePositionObj = new THREE.Object3D();
    circlePositionObj.visible = false;
    var circleGeom = new THREE.Geometry();
    addAnnulus(circleGeom, 0, 0, 
               options.flatDropInnerRadius,
               options.flatDropOuterRadius,
               12, 0);
    var circleScaleObj = new THREE.Mesh(circleGeom, flatDropMat);
    circlePositionObj.add(circleScaleObj);
    circlePositionObj.visible = false;

    var flatDropObj = new THREE.Object3D();
    flatDropObj.add(circlePositionObj);
    flatDropObj.visible = true;
    var trailMat = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: wviz.settings.drop.trailLineWidth
    });
    var trailXY = [];
    var lastTrailPoint = null;
    var flatTrailZ = wviz.settings.terrain.baseZLevel4;
    var terrainTrailObj = new THREE.Object3D();
    var flatTrailObj = new THREE.Object3D();
    var terrainTrailTObj = new THREE.Object3D();
    var flatTrailTObj = new THREE.Object3D();
    terrainTrailTObj.add(terrainTrailObj);
    flatTrailTObj.add(flatTrailObj);

    return {
        terrainDropObj: spherePositionObj,
        flatDropObj: circlePositionObj,
        terrainTrailTObj: terrainTrailTObj,
        flatTrailTObj: flatTrailTObj,
        uv: null,
        clearTrail: function() {
            trailXY = [];
            terrainTrailTObj.remove(terrainTrailObj);
            flatTrailTObj.remove(flatTrailObj);
            terrainTrailObj = new THREE.Object3D();
            flatTrailObj = new THREE.Object3D();
            terrainTrailTObj.add(terrainTrailObj);
            flatTrailTObj.add(flatTrailObj);
            lastTrailPoint = null;

        },
        txRenderTrail: function(ctx) {
            if (trailXY.length > 0) {
                ctx.strokeStyle(wviz.settings.drop.trailColor);
                ctx.lineWidth(wviz.settings.drop.trailLineWidth);
                ctx.beginPath();
                ctx.moveTo(trailXY[0][0], trailXY[0][1]);
                var i;
                for (i=1; i<trailXY.length; ++i) {
                    ctx.lineTo(trailXY[i][0], trailXY[i][1]);
                }
                ctx.stroke();
            }
        },
        moveToUV: function(u,v) {
            this.uv = [u,v];
            var xy = m.uv_to_xy([u,v]);
            var x = xy[0];
            var y = xy[1];
            trailXY.push(xy);
            var z = m.meshData[u][v]+wviz.settings.drop.radius/2;
            wviz.blueDrop.uv = [u,v];
            spherePositionObj.visible = true;
            spherePositionObj.position.set(x,y,z);
            circlePositionObj.visible = true;
            circlePositionObj.position.set(x,y,options.baseZ);
            //wviz.textureNeedsRendering = true;
            if (lastTrailPoint) {
                var terrainTrailGeom = new THREE.Geometry();
                var flatTrailGeom = new THREE.Geometry();
                terrainTrailGeom.vertices.push(new THREE.Vector3(lastTrailPoint[0],
                                                                 lastTrailPoint[1],
                                                                 lastTrailPoint[2]));
                terrainTrailGeom.vertices.push(new THREE.Vector3(x, y, m.meshData[u][v]));
                terrainTrailObj.add(new THREE.LineSegments(terrainTrailGeom, trailMat));
                flatTrailGeom.vertices.push(new THREE.Vector3(lastTrailPoint[0],
                                                              lastTrailPoint[1],
                                                              flatTrailZ));
                flatTrailGeom.vertices.push(new THREE.Vector3(x, y, flatTrailZ));
                flatTrailObj.add(new THREE.LineSegments(flatTrailGeom, trailMat));
            }
            lastTrailPoint = [x,y,m.meshData[u][v]];
            wviz.emit({type: options.eventType, uv: [u,v]});
        },
        setRadius: function(r) {
            sphereScaleObj.scale.set(r,r,r);
        }
    };
}

wviz.launch = function(canvas, width, height, commands) {

    var renderer = new THREE.WebGLRenderer({
        canvas: canvas
    });
    //var gl = renderer.context;
    //gl.enable ( gl.BLEND ) ;
    renderer.setSize( width, height );
    renderer.setClearColor(wviz.settings.backgroundColor, 1);

    var camera = createCamera(width, height);
    wviz.camera = camera;
    wviz.world = new THREE.Object3D();
    wviz.d3 = new THREE.Object3D();
    wviz.d2 = new THREE.Object3D();
    wviz.world.add(wviz.d2);
    wviz.world.add(wviz.d3);
    wviz.world.matrixAutoUpdate = false;


    var zNudged3DEdges = new THREE.Object3D();
    var zNudged2DEdges = new THREE.Object3D();
    zNudged3DEdges.matrixAutoUpdate = false;
    zNudged2DEdges.matrixAutoUpdate = false;
    wviz.d3.add(zNudged3DEdges);
    wviz.d2.add(zNudged2DEdges);

    wviz.axes = axes.axes3D({
        length: 0.75,
        tipRadius: 0.05,
        tipHeight: 0.3
    });
    wviz.d3.add(wviz.axes);
    wviz.axes.visible = wviz._visible.axes;
    wviz.d3.visible = wviz._visible.d3;
    wviz.d2.visible = wviz._visible.d2;
    var scene = new THREE.Scene();
    scene.add( camera );
    scene.add( wviz.world );
    scene.add( new THREE.AmbientLight( 0x222222 ) );
    wviz.settings.lights.directional.forEach(function(lt) {
        var light = new THREE.DirectionalLight( lt.color, lt.intensity );
        light.position.set(lt.position[0], lt.position[1], lt.position[2]);
        scene.add( light );
    });

    function render() {
        var T = new THREE.Matrix4().makeTranslation(0, 0, wviz.settings.edgeZNudge);
        zNudged3DEdges.matrix = EventTracker.computeTransform(zNudged3DEdges,camera,camera, T);
        zNudged3DEdges.matrixWorldNeedsUpdate = true;
        zNudged2DEdges.matrix = EventTracker.computeTransform(zNudged2DEdges,camera,camera, T);
        zNudged2DEdges.matrixWorldNeedsUpdate = true;
        if (wviz.textureNeedsRendering) {
            renderTexture();
            wviz.textureNeedsRendering = false;
        }
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

    var raycaster = new THREE.Raycaster();

    wviz.pick = function(x,y,callback,nopick_callback) {
        var mouse = new THREE.Vector2();
        mouse.x = ( x / window.innerWidth ) * 2 - 1;
        mouse.y = - ( y / window.innerHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObjects( scene.children, true );
        var minDist = 999999;
        var minObj = null;
        intersects.forEach(function(iobj) {
            if (iobj.object.pickable) {
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
        } else if (nopick_callback) {
            nopick_callback();
        }
    };

    wviz.fonts = {};
    var loader = new THREE.FontLoader();
    loader.load( './libs/threejs/fonts/optimer_regular.typeface.json', function ( font ) {
        wviz.fonts.optimer = font;
        terrain.load('./data/dem3.mesh', wviz.settings, function(t) {
            //terrain.load('./data/smallmesh32x32.mesh', wviz.settings, function(t) {
            wviz.m = t.m;

            wviz.terrainFaces = t.terrainFaces;
            wviz.terrainFaces.visible = wviz._visible.terrainFaces;
            wviz.d3.add(t.terrainFaces);
            wviz.terrainFaces.pickable = true;
            wviz.terrainEdges = t.terrainEdges;
            wviz.terrainEdges.visible = wviz._visible.terrainEdges;
            zNudged3DEdges.add(t.terrainEdges);

            wviz.baseFaces = t.baseFaces;
            wviz.baseFaces.visible = wviz._visible.baseFaces;
            wviz.d2.add(t.baseFaces);
            wviz.baseFaces.pickable = true;

            wviz.basePoints = t.basePoints;
            wviz.basePoints.visible = wviz._visible.basePoints;
            wviz.d2.add(t.basePoints);

            wviz.terrainTextureContext = t.terrainTextureContext;
            wviz.flatTextureContext = t.flatTextureContext;

            wviz.blueDrop = makeDrop(wviz.m, {
                terrainDropColor: 0x3333ff,
                terrainDropRadius: wviz.settings.drop.radius,
                flatDropColor: 0x3333ff,
                flatDropInnerRadius: 0.015,
                flatDropOuterRadius: 0.045,
                baseZ: wviz.settings.terrain.baseZLevel2,
                eventType: "uvset"
            });
            wviz.d3.add( wviz.blueDrop.terrainDropObj );
            wviz.d2.add( wviz.blueDrop.flatDropObj );
            zNudged3DEdges.add( wviz.blueDrop.terrainTrailTObj );
            zNudged2DEdges.add( wviz.blueDrop.flatTrailTObj );

            wviz.yellowDrop = makeDrop(wviz.m, {
                terrainDropColor: 0xcccc00,
                terrainDropRadius: 1.5*wviz.settings.drop.radius,
                flatDropColor: 0xcccc00,
                flatDropInnerRadius: 0.015,
                flatDropOuterRadius: 0.1,
                baseZ: wviz.settings.terrain.baseZLevel1,
                eventType: "yuvset"
            });
            wviz.d3.add( wviz.yellowDrop.terrainDropObj );
            wviz.d2.add( wviz.yellowDrop.flatDropObj );

            wviz.d2.add(t.baseArrows);
            wviz.baseArrows = t.baseArrows;

            renderTexture();

            wviz.requestRender();
            wviz.emit({type: "launched"});
        });
    });

};

wviz.setBlueUV = function(uv) {
    if (uv) {
        wviz.blueDrop.moveToUV(uv[0], uv[1]);
    }
};

wviz.setYellowUV = function(uv) {
    if (uv) {
        wviz.yellowDrop.moveToUV(uv[0], uv[1]);
    }
};

function txDrawUpstreamMultiPolygons(ctx) {
    if (wviz.upstreamMultiPolygons) {
        wviz.upstreamMultiPolygons.forEach(function(mp) {
            var bdy = mp.bdy();
            bdy.polylines.forEach(function(pl) {
                if (pl.length > 2) {
                    ctx.fillStyle("#ff0000");
                    ctx.beginPath();
                    ctx.moveTo(pl[0][0], pl[0][1]);
                    pl.slice(1).forEach(function(p) {
                        ctx.lineTo(p[0], p[1]);
                    });
                    ctx.closePath();
                    ctx.fill();
                }
            });
        });
    }
//    if (wviz.upstreamMultiPolygons) {
//        wviz.upstreamMultiPolygons.forEach(function(mp) {
//            var p = mp.polygons();
//            p.faces.forEach(function(vi) {
//                if (vi.length > 2) {
//                    ctx.fillStyle("#ff0000");
//                    ctx.beginPath();
//                    ctx.moveTo(p.vertices[vi[0]][0], p.vertices[vi[0]][1]);
//                    vi.slice(1).forEach(function(i) {
//                        ctx.lineTo(p.vertices[i][0], p.vertices[i][1]);
//                    });
//                    ctx.closePath();
//                    ctx.fill();
//                }
//            });
//        });
//    }
}

function txDrawUpstreamMultiPolygonBoundaries(ctx) {
    if (wviz.upstreamMultiPolygons) {
        wviz.upstreamMultiPolygons.forEach(function(mp) {
            var bdy = mp.bdy();
            bdy.polylines.forEach(function(pl) {
                if (pl.length > 2) {
                    ctx.strokeStyle("#000000");
                    ctx.lineWidth(4);
                    ctx.beginPath();
                    ctx.moveTo(pl[0][0], pl[0][1]);
                    pl.slice(1).forEach(function(p) {
                        ctx.lineTo(p[0], p[1]);
                    });
                    ctx.closePath();
                    ctx.stroke();
                }
            });
        });
    }
}


wviz.clearUpstreamAreas = function() {
    wviz.upstreamMultiPolygons = [];
};

wviz.addCurrentYellowDropUpstreamArea = function() {
    if (wviz.yellowDrop.terrainDropObj.visible) {
        var upoints = upstream.upStreamPoints(wviz.yellowDrop.uv, wviz.m);
        var mp = upstream.multiPolygonFromPoints(upoints, wviz.m, 0);
        if (!("upstreamMultiPolygons" in wviz)) {
            wviz.upstreamMultiPolygons = [];
        }
        wviz.upstreamMultiPolygons.push(mp);
    }
    wviz.textureNeedsRendering = true;
};

module.exports = wviz;
