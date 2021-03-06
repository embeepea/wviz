var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var MultiPolygon = require('./MultiPolygon.js');
var arrow = require('./arrow.js');

//function upStreamPoints(uv, m) {
//    var points = [];
//    var marked = {};
//    function dfs(uv) {
//        var key = uv[0] + "," + uv[1];
//        if (marked[key]) { return; }
//        marked[key] = true;
//        points.push(uv);
//        m.invFlow[uv[0]][uv[1]].forEach(dfs);
//    }
//    dfs(uv);
//    return points;
//}

function upStreamPoints(uv, m) {
    var points = [];
    var marked = {};
    var q = [];
    var key = uv[0] + "," + uv[1];
    q.push(uv);
    marked[key] = true;
    while (q.length > 0) {
        uv = q.shift();
        points.push(uv);
        m.invFlow[uv[0]][uv[1]].forEach(function(uv) {
            key = uv[0] + "," + uv[1];
            if (!marked[key]) {
                q.push(uv);
                marked[key] = true;
            }
        });
    }
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
    function xymidpoint(u0,v0,u1,v1) {
        var xy0 = m.uv_to_xy([u0,v0]);
        var xy1 = m.uv_to_xy([u1,v1]);
        return [(xy0[0] + xy1[0])/2, (xy0[1] + xy1[1])/2];
    }
    points.forEach(function(uv) {
        var u = uv[0];
        var v = uv[1];
        mp.addPolygon([xymidpoint(u,v, u-1,v-1),
                       xymidpoint(u,v, u-1,v+1),
                       xymidpoint(u,v, u+1,v+1),
                       xymidpoint(u,v, u+1,v-1)]);
    });
    return mp;
}

function flowArrow(uv, m, upoints) {
    var xys = upoints.slice(0,25).map(m.uv_to_xy);
    var i;
    var p = [0,0];
    for (i=0; i<xys.length; ++i) {
        p[0] += xys[i][0];
        p[1] += xys[i][1];
    }
    p[0] /= xys.length;
    p[1] /= xys.length;
    var a = arrow.farrow(m.uv_to_xy(uv), p, m.isEdge(uv), 2.0, 0.5, 0.5, 0.15);
    return a;
}

module.exports = {
    upStreamPoints: upStreamPoints,
    meshMidpoint: meshMidpoint,
    multiPolygonFromPoints: multiPolygonFromPoints,
    flowArrow: flowArrow
    //multiPolygonToObj3: multiPolygonToObj3
};
