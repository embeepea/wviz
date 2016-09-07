var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var trail = require('./trail.js');

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

function makeDrop(wviz, options) {
    var geometry = new THREE.SphereGeometry( 1, 16, 16 );
    var sphereDropMat = new THREE.MeshPhongMaterial({
        color: options.terrainDropColor,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var sphereScaleObj = new THREE.Object3D();
    var radius = options.terrainDropRadius;
    sphereScaleObj.scale.set(radius,radius,radius);
    sphereScaleObj.add( new THREE.Mesh( geometry, sphereDropMat ) );
    var spherePositionObj = new THREE.Object3D();
    spherePositionObj.add(sphereScaleObj);
    spherePositionObj.visible = false;

    var flatDropMat = new THREE.MeshBasicMaterial({
        color: options.flatDropColor,
        side: THREE.DoubleSide
    });

    var circlePositionObj = new THREE.Object3D();
    circlePositionObj.visible = false;
    var circleGeom = new THREE.Geometry();
    addAnnulus(circleGeom, 0, 0, 
               options.flatDropInnerRadius,
               options.flatDropOuterRadius,
               12, 0);
    var circleScaleObj = new THREE.Mesh(circleGeom, flatDropMat);
    circlePositionObj.add(circleScaleObj);

    var trailMat = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: wviz.settings.drop.trailLineWidth
    });
    var trailXY = [];
    var trailXYs = [];
    var flatTrailZ = wviz.settings.terrain.baseZLevel4;
    var terrainTrail = trail.trail({
        color: 0x0000ff,
        linewidth: wviz.settings.drop.trailLineWidth
    });
    var flatTrail = trail.trail({
        color: 0x0000ff,
        linewidth: wviz.settings.drop.trailLineWidth
    });

    var heightLineMat = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 3
    });
    var heightLineObjContainer = new THREE.Object3D();
    heightLineObjContainer.visible = false;
    var heightLineObj;

    return {
        terrainDropObj: spherePositionObj,
        flatDropObj: circlePositionObj,
        terrainTrailTObj: terrainTrail.tobj,
        flatTrailTObj: flatTrail.tobj,
        heightLineTObj: heightLineObjContainer,
        uv: null,
        getTrails: function() {
            function serializeTrail(trailXY) {
                if (!trailXY) { return null; }
                if (trailXY.length===0) { return null; }
                var uv = wviz.m.xy_to_uv([trailXY[0][0], trailXY[0][1]]);
                return {
                    start: uv,
                    length: trailXY.length
                };
            }
            var ans = [ serializeTrail(trailXY) ];
            trailXYs.map(serializeTrail).filter(function(s) { return s!==null; }).forEach(function(s) {
                ans.push(s);
            });
            return ans;
        },
        setTrails: function(trails) {
            this.clearTrail();
            this.clearAllTrails();
            var thisDrop = this;
            function trace(tr) {
                thisDrop.clearTrail();
                thisDrop.moveToUV([tr.start[0], tr.start[1]]);
                var i;
                for (i=1; i<tr.length; ++i) {
                    var nextUV = wviz.m.flow[thisDrop.uv[0]][thisDrop.uv[1]];
                    if (nextUV) {
                        thisDrop.moveToUV([nextUV[0], nextUV[1]]);
                    }
                }
            }
            // `trails` is an array of objects like { start: [177,84], length: 232 }
            // the first element in `trails` is the 'current' trailXY
            // the other elements in `trails` are the other trailXYs
            // first trace out these other trailXYs:
            trails.slice(1).forEach(trace);
            // then trace out the current trailXY, if non-null
            if (trails.length > 0 && trails[0]) { trace(trails[0]); }
            wviz.textureNeedsRendering = true;
            wviz.requestRender();
        },
        clearAllTrails: function() {
            trailXYs = [];
            wviz.textureNeedsRendering = true;
        },
        clearTrail: function() {
            if (trailXY) {
                trailXYs.push(trailXY);
                wviz.textureNeedsRendering = true;
            }
            trailXY = [];
            terrainTrail.clear();
            flatTrail.clear();
        },
        txRenderTrails: function(ctx) {
            if (trailXYs.length > 0) {
                trailXYs.forEach(function(trailXY) {
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
                });
            }
        },
        hide: function() {
            spherePositionObj.visible = false;
            circlePositionObj.visible = false;
            heightLineObjContainer.visible = false;
        },
        moveToUV: function(uv, mOptions) {
            if (!mOptions) { mOptions = {}; }
            var u = uv[0];
            var v = uv[1];
            this.uv = [u,v];
            var xy = wviz.m.uv_to_xy(uv);
            var x = xy[0];
            var y = xy[1];
            trailXY.push(xy);
            var z = wviz.m.meshData[u][v]+radius/2;
            spherePositionObj.visible = true;
            spherePositionObj.position.set(x,y,z);
            circlePositionObj.visible = true;
            circlePositionObj.position.set(x,y,options.baseZ);
            if (heightLineObj) { 
                heightLineObjContainer.remove(heightLineObj);
            }
            var heightLineGeom = new THREE.Geometry();
            heightLineGeom.vertices.push(new THREE.Vector3(x,y,options.baseZ));
            heightLineGeom.vertices.push(new THREE.Vector3(x,y,wviz.m.meshData[u][v]));
            heightLineObj = new THREE.LineSegments(heightLineGeom, heightLineMat);
            heightLineObjContainer.add(heightLineObj);
            if (!mOptions.advance) {
                terrainTrail.clear();
                flatTrail.clear();
            }
            terrainTrail.addPoint([x, y, wviz.m.meshData[u][v]]);
            flatTrail.addPoint([x, y, flatTrailZ]);
            wviz.emit({type: options.eventType, uv: uv});
        },
        advanceOnce: function() {
            var nextUV = wviz.m.flow[this.uv[0]][this.uv[1]];
            if (nextUV) {
                this.moveToUV([nextUV[0], nextUV[1]], {advance: true});
            }
        },
        setRadius: function(r) {
            sphereScaleObj.scale.set(r,r,r);
            radius = r;
        },
        getRadius: function() {
            return radius;
        }
    };
}

module.exports = {
    makeDrop: makeDrop,
    addAnnulus: addAnnulus
};
