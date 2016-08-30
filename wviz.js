var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var EventTracker = require('./EventTracker.js');
var event_emitter = require('./event_emitter.js');
var axes = require('./axes.js');
var terrain = require('./terrain.js');

var wviz = {};
window.wviz = wviz;

wviz.settings = {
    backgroundColor: 0xffffff,
    terrain: {
        //txSize: 1024,
        txSize: 2048,
        txBackgroundColor: "rgba(136,255,136,0.1)",
        latticeZ: -0.5
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
        radius: 0.1,
        fallSpeed: 100
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
    gridLines: true,
    gridPoints: false,
    faces: true,
    d3: true,
    d2: false,
    axes: true
};

function renderTexture() {
    txClear(wviz.terrainTextureContext);
    txClear(wviz.flatTextureContext);

    if (wviz._visible.gridPoints) {
        txDrawGridPoints(wviz.terrainTextureContext);
        txDrawGridPoints(wviz.flatTextureContext);
    }
    if (wviz._visible.gridLines) {
        txDrawGridLines(wviz.terrainTextureContext);
        txDrawGridLines(wviz.flatTextureContext);
    }
}

wviz.advanceDropOnce = function(a) {
    if (wviz.drop.uv) {
        if (typeof(a)==="undefined") { a = 1; }
        while (a-- > 0) {
            var nextUV = wviz.m.flow[wviz.drop.uv[0]][wviz.drop.uv[1]];
            if (nextUV) {
                wviz.drop.moveToUV(nextUV[0], nextUV[1]);
                wviz.requestRender();
            }
        }
    }
};

wviz.visible = function(what, v) {
    if (typeof(v) !== "undefined") {
        wviz._visible[what] = v;
        wviz.textureNeedsRendering = true;
        if (what === "faces") {
            wviz.faces.visible = v;
        } else if (what === "d3") {
            wviz.d3.visible = v;
        } else if (what === "d2") {
            wviz.d2.visible = v;
        } else if (what === "axes") {
            wviz.axes.visible = v;
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

function makeDrop(m) {
    var geometry = new THREE.SphereGeometry( 1, 16, 16 );
    var sphereDropMat = new THREE.MeshPhongMaterial({
        color: 0x3333ff,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var sphereScaleObj = new THREE.Object3D();
    sphereScaleObj.scale.set(wviz.settings.drop.radius,
                             wviz.settings.drop.radius,
                             wviz.settings.drop.radius);
    sphereScaleObj.add( new THREE.Mesh( geometry, sphereDropMat ) );
    var spherePositionObj = new THREE.Object3D();
    spherePositionObj.add(sphereScaleObj);
    spherePositionObj.visible = false;

    return {
        terrainDropObj: spherePositionObj,
        uv: null,
        moveToUV: function(u,v) {
            var xy = m.uv_to_xy([u,v]);
            var x = xy[0];
            var y = xy[1];
            var z = m.meshData[u][v]+wviz.settings.drop.radius;
            wviz.drop.uv = [u,v];
            this.uv = [u,v];
            spherePositionObj.visible = true;
            spherePositionObj.position.set(x,y,z);
            wviz.emit({type: "uvset", uv: [u,v]});
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

    wviz.pick = function(x,y,callback) {
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
        }
    };

    terrain.load('./data/dem3.mesh', wviz.settings, function(t) {
    //terrain.load('./data/smallmesh32x32.mesh', wviz.settings, function(t) {
        wviz.m = t.m;

        wviz.faces = t.faces;
        wviz.faces.visible = wviz._visible.faces;
        wviz.d3.add(t.faces);
        wviz.faces.pickable = true;

        wviz.latticeQuad = t.latticeQuad;
        wviz.latticeQuad.visible = wviz._visible.latticeQuad;
        wviz.d2.add(t.latticeQuad);
        wviz.latticeQuad.pickable = true;

        wviz.terrainTextureContext = t.terrainTextureContext;
        wviz.flatTextureContext = t.flatTextureContext;

        wviz.drop = makeDrop(wviz.m);
        wviz.d3.add( wviz.drop.terrainDropObj );

        renderTexture();

        wviz.requestRender();
        wviz.emit({type: "launched"});
    });



};

module.exports = wviz;
