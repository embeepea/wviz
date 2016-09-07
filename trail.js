var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');

var HIDDEN_POINT = [0,0,10000];

function segmentBatch(mat) {
    var geom = new THREE.Geometry();
    var N = 500; // max number of segments possible in this batch
    var n = 0;    // number of segments currently in this batch
    var i;
    // Important note: for some unknown reason, dynamic updates to the vertices of the
    // LineSegments Geometry object do not seem to work unless the first pair of vertices
    // is initialized to coordinates that are small numbers.   WTF??? !!!!
    geom.vertices.push(new THREE.Vector3(0,0,0));
    geom.vertices.push(new THREE.Vector3(0,0,0));
    for (i=1; i<N; ++i) {
        geom.vertices.push(new THREE.Vector3(HIDDEN_POINT[0],HIDDEN_POINT[1],HIDDEN_POINT[2]));
        geom.vertices.push(new THREE.Vector3(HIDDEN_POINT[0],HIDDEN_POINT[1],HIDDEN_POINT[2]));
    }
    var lineSegments = new THREE.LineSegments(geom, mat);
    return {
        tobj: lineSegments,
        isFull: function() {
            return n === N;
        },
        addSegment: function(s) {
            var vi = 2*n;
            geom.vertices[vi].fromArray(s[0]);
            geom.vertices[vi+1].fromArray(s[1]);
            geom.verticesNeedUpdate = true;
            ++n;
        },
        clear: function() {
            for (i=0; i<n; ++i) {
                geom.vertices[2*i].fromArray(HIDDEN_POINT);
                geom.vertices[2*i+1].fromArray(HIDDEN_POINT);
            }
            geom.verticesNeedUpdate = true;
            n = 0;
        }
    };
}

function trail(options) {
    var mat = new THREE.LineBasicMaterial({
        color: options.color,
        linewidth: options.linewidth
    });
    var trailContainer = new THREE.Object3D();
    var segmentBatches = [];
    var batch = segmentBatch(mat);
    segmentBatches.push(batch);
    trailContainer.add(batch.tobj);
    var currentSegmentBatchIndex = 0;
    var pPrev = null;
    return {
        tobj: trailContainer,
        addPoint: function(p) {
            var batch = segmentBatches[currentSegmentBatchIndex];
            if (pPrev) {
                if (batch.isFull()) {
                    ++currentSegmentBatchIndex;
                    if (currentSegmentBatchIndex >= segmentBatches.length) {
                        batch = segmentBatch();
                        segmentBatches.push(batch);
                        trailContainer.add(batch.tobj);
                    }
                }
                batch.addSegment([pPrev, p]);
            }
            pPrev = p;
        },
        clear: function() {
            segmentBatches.forEach(function(batch) {
                batch.clear();
            });
            currentSegmentBatchIndex = 0;
            pPrev = null;
        }
    };
}

//function trail(options) {
//    var mat = new THREE.LineBasicMaterial({
//        color: options.color,
//        linewidth: options.linewidth
//    });
//    var trailContainer = new THREE.Object3D();
//    var trailSegments = new THREE.Object3D();
//    var pPrev = null;
//    var nSegments = 0;
//    trailContainer.add(trailSegments);
//    return {
//        tobj: trailContainer,
//        addPoint: function(p) {
//            if (pPrev) {
//                var segmentGeom = new THREE.Geometry();
//                segmentGeom.vertices.push(new THREE.Vector3(pPrev[0], pPrev[1], pPrev[2]));
//                segmentGeom.vertices.push(new THREE.Vector3(p[0], p[1], p[2]));
//                trailSegments.add(new THREE.LineSegments(segmentGeom, mat));
//                ++nSegments;
//            }
//            pPrev = p;
//        },
//        clear: function() {
//            trailContainer.remove(trailSegments);
//            trailSegments = new THREE.Object3D();
//            trailContainer.add(trailSegments);
//            pPrev = null;
//            nSegments = 0;
//        }
//    };
//}

module.exports = {
    trail: trail
};
