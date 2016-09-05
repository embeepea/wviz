function sub(u,v) {
    return u.map(function(x,i) { return x - v[i]; });
}
function add(u,v) {
    return u.map(function(x,i) { return x + v[i]; });
}
function norm2(v) {
    return v.reduce(function(a,x) { return a + x*x; }, 0);
}
function norm(v) {
    return Math.sqrt(norm2(v));
}
function perp(v) {
    return [-v[1],v[0]];
}
function smul(v,s) {
    return v.map(function(x) { return s*x; });
}
function unit(v) {
    return smul(v, 1/norm(v));
}

function arrow(t, h, a, b, c) {
    // t = position of tail
    // h = position of head
    // a = length of head
    // b = half width of head
    // c = half width of shaft
    var v = sub(h,t);
    var u = unit(v);
    var w = sub(h,smul(u,a));
    var uperp = perp(u);
    var m1 = add(w,smul(uperp,c));
    var m2 = add(w,smul(uperp,-c));
    var n1 = add(t,smul(uperp,c));
    var n2 = add(t,smul(uperp,-c));
    var l1 = add(w,smul(uperp,b));
    var l2 = add(w,smul(uperp,-b));
    var ans = {
        headFaces: [[l1,h,l2]],
        shaftFaces: [[n2, n1, m2], [m1, m2, n1]],
        shaftLines: [[t,w]],
        perimeter: [h, l1, m1, n1, n2, m2, l2]
    };
    return ans;
}

function garrow(t, h, g, a, b, c) {
    var v = sub(h,t);
    var u = unit(v);
    var ans = arrow(add(t,smul(u,g)), sub(h,smul(u,g)), a, b, c);
    return ans;
}

function farrow(t, h, isEdge, l, a, b, c) {
    var u = unit(sub(t,h));
    if (isEdge) {
        return arrow(add(h, smul(u,-l)), h, a, b, c);
    } else {
        return arrow(add(h, smul(u,-l/2)), add(h, smul(u,l/2)), a, b, c);
    }
}

module.exports = {
    arrow: arrow,
    garrow: garrow,
    farrow: farrow
};
