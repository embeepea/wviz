var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var EventTracker = require('./EventTracker.js');
var event_emitter = require('./event_emitter.js');
var axes = require('./axes.js');
var terrain = require('./terrain.js');
var upstream = require('./upstream.js');
var qinterp = require('./qinterp.js');
var parseUtils = require('./parseUtils.js');
var drop = require('./drop.js');

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
        //txBackgroundColor: "rgba(136,255,136,0.1)",
        txBackgroundColor: "#eeeeee",
        baseZLevel0: baseZ+0,     // baseFace
        baseZLevel1: baseZ+0.001, // yellow dot
        baseZLevel2: baseZ+0.002, // blue dot
        baseZLevel3: baseZ+0.003, // dots & arrows
        baseZLevel4: baseZ+0.004  // text
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
        position: [-15,1,15],
        near: 0.1,
        far: 1000,
// for essentially orthographic projection, use the following:
//        fov: 0.1,
//        position: [0,0,1000],
//        near: 0.1,
//        far: 10000,
        up: [0,0.1,1],
        lookAt: [-2,0,0]
    },
    drop: {
        radius: 0.05,
        fallRate: 1,
        trailColor: "#0000ff",
        trailLineWidth: 8,
        baseNeighborInnerRadius: 0.015,
        baseNeighborOuterRadius: 0.02
    }
};

event_emitter(wviz);

function txClear(ctx, options) {
    if (!options) { options = {}; }
    ctx.clear();
    if (options.bgImageId) {
        var img=document.getElementById(options.bgImageId);
        ctx.canvasContext.drawImage(img,0,0);
    } else {
        ctx.fillStyle(wviz.settings.terrain.txBackgroundColor);
        ctx.fillRect(-10,-10,20,20);
    }
};

function txDrawUpstreamFlowArrows(ctx) {
    if (!wviz.upstreamFlowArrows) { return; }
    ctx.fillStyle("#66ffff");
    wviz.upstreamFlowArrows.forEach(function(fa) {
        ctx.beginPath();
        fa.perimeter.forEach(function(xy,i) {
            if (i===0) {
                ctx.moveTo(xy[0],xy[1]);
            } else {
                ctx.lineTo(xy[0],xy[1]);
            }
        });
        ctx.closePath();
        ctx.fill();
    });
}

function txDrawUpstreamFlowArrowBoundaries(ctx) {
    if (!wviz.upstreamFlowArrows) { return; }
    ctx.fillStyle("#000000");
    ctx.lineWidth(1);
    wviz.upstreamFlowArrows.forEach(function(fa) {
        ctx.beginPath();
        fa.perimeter.forEach(function(xy,i) {
            if (i===0) {
                ctx.moveTo(xy[0],xy[1]);
            } else {
                ctx.lineTo(xy[0],xy[1]);
            }
        });
        ctx.closePath();
        ctx.stroke();
    });
}

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
    terrainEdges: false,
    terrainFaces: true,
    baseFaces: true,
    basePoints: true,
    baseArrows: false,
    blueDropHeightLine: false,
    d3: true,
    d2: false,
    axes: false,
    gravityArrows: false
};

function renderTexture() {
    txClear(wviz.terrainTextureContext, {bgImageId: "reliefimg"});
    txClear(wviz.flatTextureContext);

    txDrawUpstreamMultiPolygons(wviz.terrainTextureContext);
    txDrawUpstreamMultiPolygonBoundaries(wviz.terrainTextureContext);
    txDrawUpstreamFlowArrows(wviz.terrainTextureContext);
    txDrawUpstreamFlowArrowBoundaries(wviz.terrainTextureContext);

    txDrawUpstreamMultiPolygons(wviz.flatTextureContext);
    txDrawUpstreamMultiPolygonBoundaries(wviz.flatTextureContext);
    txDrawUpstreamFlowArrows(wviz.flatTextureContext);
    txDrawUpstreamFlowArrowBoundaries(wviz.flatTextureContext);

    //if (wviz._visible.gridPoints) {
    //    txDrawGridPoints(wviz.terrainTextureContext);
    //    txDrawGridPoints(wviz.flatTextureContext);
    //}
    //if (wviz._visible.terrainEdges) {
    //    txDrawGridLines(wviz.terrainTextureContext);
    //    txDrawGridLines(wviz.flatTextureContext);
    //}

    if (wviz.blueDrop && wviz.blueDrop.uv) {
        wviz.blueDrop.txRenderTrails(wviz.terrainTextureContext);
        wviz.blueDrop.txRenderTrails(wviz.flatTextureContext);
    }
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
    var defaultTerrainDropMat = new THREE.MeshPhongMaterial({
        color: 0x000000,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var nextTerrainDropMat = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var defaultBaseDropMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.DoubleSide
    });
    var nextBaseDropMat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide
    });
    var neighbors3d = new THREE.Object3D();
    var neighbors2d = new THREE.Object3D();
    points.forEach(function(point) {
        var xy = wviz.m.uv_to_xy(point);
        var next = wviz.m.flow[wviz.blueDrop.uv[0]][wviz.blueDrop.uv[1]];
        var sphGeom = new THREE.SphereGeometry( wviz.blueDrop.getRadius()/2, 8, 8 );
        var sphMesh = new THREE.Mesh(sphGeom, (point[0]===next[0] && point[1]===next[1]) ? nextTerrainDropMat : defaultTerrainDropMat);
        sphMesh.position.set(xy[0], xy[1], wviz.m.meshData[point[0]][point[1]]);
        neighbors3d.add( sphMesh );
        var annGeom = new THREE.Geometry();
        drop.addAnnulus(annGeom, 0, 0, 
                        wviz.settings.drop.baseNeighborInnerRadius,
                        wviz.settings.drop.baseNeighborOuterRadius,
                        12, 0);
        var annMesh = new THREE.Mesh(annGeom, (point[0]===next[0] && point[1]===next[1]) ? nextBaseDropMat : defaultBaseDropMat);
        annMesh.position.set(xy[0], xy[1], wviz.settings.terrain.baseZLevel3);
        neighbors2d.add( annMesh );
    });
    return {
        d2: neighbors2d,
        d3: neighbors3d
    };
}

function makeNeighborHeightLines() {
    var points = neighborUVPoints(wviz.blueDrop.uv, true);
    if (points === null) { return null; }

    var defaultLineMat = new THREE.LineBasicMaterial({
        color: 0x000000,
        linewidth: 5
    });
    var currentLineMat = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 5
    });
    var nextLineMat = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 5
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
        color: 0xffffff
    });
    var textOptions = {
        // font — THREE.Font.
        font: wviz.fonts.optimer,
        // size — Float. Size of the text.
        size: 0.015,
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
                var textGeom = new THREE.TextGeometry(sprintf("%1d", 1000*wviz.m.meshData[u][v]),
                                                      textOptions);
                var textMesh = new THREE.Mesh(textGeom, mat);
                oneTextObj.add(textMesh);
                oneTextObj.position.set(xy[0] + 0.2*textOptions.size,
                                        xy[1] - 0.2*textOptions.size,
                                        wviz.settings.terrain.baseZLevel4);
                oneTextObj.rotation.set(0,0,-Math.PI/2);
                textObj.add(oneTextObj);
            }
        }
    }
    return textObj;
}

wviz.showNeighborPoints = function() {
    wviz.hideNeighborPoints();
    wviz.neighborPoints = makeNeighborPoints();
    wviz.d3.add(wviz.neighborPoints.d3);
    wviz.d2.add(wviz.neighborPoints.d2);
    wviz.requestRender();
};

wviz.hideNeighborPoints = function() {
    if (wviz.neighborPoints) {
        wviz.d3.remove(wviz.neighborPoints.d3);
        wviz.d2.remove(wviz.neighborPoints.d2);
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
            wviz.blueDrop.advanceOnce();
        }
        //if (!nextUV) {
        //    wviz.blueDrop.endTrail();
        //}
        wviz.requestRender();
    }
};

wviz.advanceAll = function(a) {
    // arg 'a' is number of steps to take on each Frame
    if (wviz.blueDrop.uv) {
        function oneFrame() {
            var b = a, nextUV;
            var moved = false;
            while (b--) {
                moved |= wviz.blueDrop.advanceOnce();
            }
            if (moved) {
                wviz.requestRender(function() {
                    setTimeout(oneFrame, wviz.settings.drop.fallRate);
                });
            }
        }
        oneFrame();
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
        } else if (what === "gravityArrows") {
            wviz.gravityArrows.visible = v;
        } else if (what === "basePoints") {
            wviz.basePoints.visible = v;
        } else if (what === "baseArrows") {
            wviz.baseArrows.visible = v;
        } else if (what === "blueDropHeightLine") {
            wviz.blueDrop.heightLineTObj.visible = v;
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

    wviz.gravityArrows = axes.gravityArrows({
        locations: [ [-5,-5,-5], [-5,5,-5], [5,5,-5], [5,-5,-5] ],
        color: 0x0000ff,
        length: 3,
        tipRadius: 0.3,
        tipHeight: 0.75
    });
    wviz.d3.add(wviz.gravityArrows);
    wviz.gravityArrows.visible = wviz._visible.gravityArrows;

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

            wviz.blueDrop = drop.makeDrop(wviz, {
                terrainDropColor: 0x3333ff,
                terrainDropRadius: wviz.settings.drop.radius,
                flatDropColor: 0x3333ff,
                flatDropInnerRadius: 0.015,
                flatDropOuterRadius: 0.045,
                baseZ: wviz.settings.terrain.baseZLevel2,
                eventType: "uvset"
            });
            wviz.d3.add( wviz.blueDrop.terrainDropObj );
            wviz.d3.add( wviz.blueDrop.heightLineTObj );
            wviz.d2.add( wviz.blueDrop.flatDropObj );
            zNudged3DEdges.add( wviz.blueDrop.terrainTrailTObj );
            zNudged2DEdges.add( wviz.blueDrop.flatTrailTObj );

            wviz.yellowDrop = drop.makeDrop(wviz, {
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

            wviz.baseForwardArrows = t.baseArrows;
            wviz.baseReverseArrows = t.baseReverseArrows;
            wviz.baseArrows = new THREE.Object3D();
            wviz.d2.add(wviz.baseArrows);
            wviz.baseArrows.add(wviz.baseForwardArrows);
            wviz.baseArrows.visible = wviz._visible.baseArrows;

            renderTexture();

            wviz.requestRender();
            wviz.emit({type: "launched"});
        });
    });

};

wviz.flipArrows = function() {
    var child = wviz.baseArrows.children[0];
    wviz.baseArrows.remove(child);
    if (child === wviz.baseForwardArrows) {
        wviz.baseArrows.add(wviz.baseReverseArrows);
    } else {
        wviz.baseArrows.add(wviz.baseForwardArrows);
    }
};

wviz.setBlueUV = function(uv) {
    if (uv) {
        wviz.blueDrop.clearTrail();
        wviz.blueDrop.moveToUV(uv);
    } else {
        wviz.blueDrop.hide();
    }
};
wviz.getBlueUV = function() {
    return wviz.blueDrop.uv;
};

wviz.setYellowUV = function(uv) {
    if (uv) {
        wviz.yellowDrop.moveToUV(uv);
    } else {
        wviz.yellowDrop.hide();
    }
};
wviz.getYellowUV = function() {
    return wviz.yellowDrop.uv;
};

function txDrawUpstreamMultiPolygons(ctx) {
    if (wviz.upstreamMultiPolygons) {
        wviz.upstreamMultiPolygons.forEach(function(mp) {
            var bdy = mp.bdy();
            bdy.polylines.forEach(function(pl) {
                if (pl.length > 2) {
                    //ctx.fillStyle("#ff0000");
                    ctx.fillStyle("rgba(255,0,0,0.6)");
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
    wviz.upstreamFlowArrows = [];
    wviz.textureNeedsRendering = true;
};

wviz.addCurrentYellowDropUpstreamArea = function() {
    if (wviz.yellowDrop.terrainDropObj.visible) {
        var upoints = upstream.upStreamPoints(wviz.yellowDrop.uv, wviz.m);
        var mp = upstream.multiPolygonFromPoints(upoints, wviz.m, 0);
        if (!("upstreamMultiPolygons" in wviz)) {
            wviz.upstreamMultiPolygons = [];
        }
        wviz.upstreamMultiPolygons.push(mp);
        if (upoints.length > 100) {
            if (!("upstreamFlowArrows" in wviz)) {
                wviz.upstreamFlowArrows = [];
            }
            wviz.upstreamFlowArrows.push(upstream.flowArrow(wviz.yellowDrop.uv, wviz.m, upoints));
        }
    }
    wviz.textureNeedsRendering = true;
};

wviz.setFallRate = function(a) {
    wviz.settings.drop.fallRate = a;
};
wviz.getFallRate = function(a) {
    return wviz.settings.drop.fallRate;
};

wviz.clearAllTrails = function(a) {
    wviz.blueDrop.clearAllTrails();
};

wviz.mmAnimateTo = function(m, nFrames, frameDelay, doneFunc) {
    var intp = qinterp.matrix4Interpolator(wviz.world.matrix, m);
    if (intp.trivial) {
        wviz.world.matrix.copy(m);
        wviz.world.matrixWorldNeedsUpdate = true;
        doneFunc();
        return;
    }
    var t = 0;
    var n = 0;
    var dt = 1.0/nFrames;
    function doFrame() {
        setTimeout(function() {
            ++n;
            t = n*dt;
            m = intp(t);
            wviz.world.matrix.copy(m);
            wviz.world.matrixWorldNeedsUpdate = true;
            wviz.requestRender();
            if (n < nFrames) {
                doFrame();
            } else {
                doneFunc();
            }
        }, frameDelay);
    }
    doFrame();
};

wviz.transitionToState = function(state, permalink) {
    if ("mm" in state) {
        wviz.mmAnimateTo(parseUtils.parseMatrix4(state.mm), 36, 50, function() {
            permalink.setState(state);
        });
    } else {
        permalink.setState(state);
    }
};

//wviz.getBlueTrailsString = function() {
//    var trails = wviz.blueDrop.getTrails();
//    return trails.map(function(tr) {
//        if (tr) {
//            return sprintf("%1d,%1d,%1d", tr.start[0], tr.start[1], tr.length);
//        }
//        return "";
//    }).join(";");
//};
//
//wviz.setBlueTrailsFromString = function(s) {
//    var trails = s.split(/;/).map(function(trString) {
//        var a = trString.split(/,/).map(function(is) { return parseInt(is,10); });
//        return {
//            start: [a[0], a[1]],
//            length: a[2]
//        };
//    });
//    wviz.blueDrop.setTrails(trails);
//};

wviz.getBlueTrails = function() {
    return wviz.blueDrop.getTrails();
};

wviz.setBlueTrails = function(trails) {
    wviz.blueDrop.setTrails(trails);
};

wviz.getBlueDropRadius = function() {
    return wviz.blueDrop.getRadius();
};

wviz.setBlueDropRadius = function(r) {
    return wviz.blueDrop.setRadius(r);
};

module.exports = wviz;
