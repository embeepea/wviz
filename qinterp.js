var THREE = require('./libs/threejs/three.js');

function decompose(m) {
    var t = new THREE.Vector3();
    var q = new THREE.Quaternion();
    var s = new THREE.Vector3();
    m.decompose(t,q,s);
    return {
        t: t,
        q: q,
        s: s
    };
}

function square(x) { return x*x; }

function ddist2(da, db) {
    return (0
            + square(da.q.x  - da.q.x)
            + square(da.q.y  - da.q.y)
            + square(da.q.z  - da.q.z)
            + square(da.q.w  - da.q.w)
            + square(da.t.x  - db.t.x)
            + square(da.t.y  - db.t.y)
            + square(da.t.z  - db.t.z)
            + square(da.s.x  - db.s.x)
            + square(da.s.y  - db.s.y)
            + square(da.s.z  - db.s.z)
           );
}

function v3interp(v0, v1, t) {
    return new THREE.Vector3((1-t)*v0.x + t*v1.x,
                             (1-t)*v0.y + t*v1.y,
                             (1-t)*v0.z + t*v1.z);
}

function qinterp(q0, q1, t) {
    var q = new THREE.Quaternion();
    THREE.Quaternion.slerp(q0, q1, q, t);
    return q;
}


function lerp(d0, d1, t) {
    return {
        t: v3interp(d0.t, d1.t, t),
        q: qinterp(d0.q, d1.q, t),
        s: v3interp(d0.s, d1.s, t)
    };
}

function matrix4Interpolator(m0, m1) {
    var d0 = decompose(m0);
    var d1 = decompose(m1);
    var f = function(t) {
        var d = lerp(d0, d1, t);
        var m = new THREE.Matrix4();
        m.compose(d.t, d.q, d.s);
        return m;
    };
    f.trivial = ddist2(d0,d1) <= 0.001;
    return f;
}

module.exports = {
    matrix4Interpolator: matrix4Interpolator
};
