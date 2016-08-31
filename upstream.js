var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var MultiPolygon = require('./MultiPolygon.js');

//{
//    var zOffset = 0.1;
//    var upoints = upStreamPoints(uv, wviz.m);
//    var mp = multiPolygonFromPoints(upoints, wviz.m, zOffset);
//    var redSurfaceMaterial = new THREE.MeshPhongMaterial({
//        color: 0xff0000,
//        side: THREE.DoubleSide,
//        shading: THREE.SmoothShading
//    });
//    if (wviz.upst) {
//        wviz.d3.remove(wviz.upst);
//    }
//    wviz.upst = multiPolygonToObj3(mp, redSurfaceMaterial);
//    wviz.d3.add(wviz.upst);
//}

function upStreamPoints(uv, m) {
    var points = [];
    var marked = {};
    function dfs(uv) {
        var key = uv[0] + "," + uv[1];
        if (marked[key]) { return; }
        marked[key] = true;
        points.push(uv);
        m.invFlow[uv[0]][uv[1]].forEach(dfs);
    }
    dfs(uv);
    return points;
}

function meshMidpoint(m, u0, v0, u1, v1) {
    var xy0 = m.uv_to_xy([u0,v0]);
    var xy1 = m.uv_to_xy([u1,v1]);
    var x = (xy0[0] + xy1[0])/2;
    var y = (xy0[1] + xy1[1])/2;
    var corners = [[u0,v0],[u1,v0],[u0,v1],[u1,v1]];
    var s = 0, n = 0;
    corners.forEach(function(uv) {
        if (m.inRange(uv)) {
            s += m.meshData[uv[0]][uv[1]];
            ++n;
        }
    });
    return [x,y,s/n];
}

function zOff(dz,v) {
    return [v[0], v[1], v[2]+dz];
}

function multiPolygonFromPoints(points, m, zOffset) {
    var mp = MultiPolygon();
    points.forEach(function(uv) {
        var u = uv[0];
        var v = uv[1];
        mp.addPolygon([zOff(zOffset,meshMidpoint(m,  u,v,  u-1,v-1)),
                       zOff(zOffset,meshMidpoint(m,  u,v,  u+1,v-1)),
                       zOff(zOffset,meshMidpoint(m,  u,v,  u+1,v+1))]);
        mp.addPolygon([zOff(zOffset,meshMidpoint(m,  u,v,  u+1,v+1)),
                       zOff(zOffset,meshMidpoint(m,  u,v,  u-1,v+1)),
                       zOff(zOffset,meshMidpoint(m,  u,v,  u-1,v-1))]);
    });
    return mp;
}

// function multiPolygonToObj3(mp, mat) {
//     var p = mp.polygons();
//     var g = new THREE.Geometry();
//     p.vertices.forEach(function(v) {
//         g.vertices.push(new THREE.Vector3(v[0], v[1], v[2]));
//     });
//     p.faces.forEach(function(f) {
//         if (f.length !== 3) {
//             console.log(sprintf("warning: mp face has !=3 verts"));
//         } else {
//             g.faces.push(new THREE.Face3(f[0], f[1], f[2]));
//         }
//     });
//     g.computeFaceNormals();
//     g.computeFaceNormals();
//     var mesh = new THREE.Mesh(g, mat);
//     return mesh;
// }

module.exports = {
    upStreamPoints: upStreamPoints,
    meshMidpoint: meshMidpoint,
    multiPolygonFromPoints: multiPolygonFromPoints
    //multiPolygonToObj3: multiPolygonToObj3
};
