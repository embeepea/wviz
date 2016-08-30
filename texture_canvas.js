var THREE = require('./libs/threejs/three.js');
var sprintf = require('sprintf');

function linear_interpolator(a,b,A,B) {
    // maps [a,b] to [A,B]
    var f = (B - A)/(b - a);
    return {
        interp: function(x) { return (x - a)*f + A; },
        scale: function(x) { return x*f; }
    };
}

function TextureCanvas(width, height, xMin, xMax, yMin, yMax) {
    var tcanvas = document.createElement("canvas");
    tcanvas.width = width;
    tcanvas.height = height;
    var tctx = tcanvas.getContext('2d');
    tctx.clearRect(0, 0, tcanvas.width, tcanvas.height);

    var ctexture = new THREE.Texture( tcanvas );
    ctexture.needsUpdate = true;

    var xInterp = linear_interpolator(xMin,xMax,0,width);
    var yInterp = linear_interpolator(yMin,yMax,0,height);
    function tcoords(x,y) {
        return [xInterp.interp(x),yInterp.interp(y)];
    }

    return {
        texture: ctexture,
        clear: function() {
            tctx.clearRect(0, 0, tcanvas.width, tcanvas.height);
            ctexture.needsUpdate = true;
        },
        fillStyle: function(style) {
            tctx.fillStyle = style;
            ctexture.needsUpdate = true;
        },
        lineWidth: function(w) {
            tctx.lineWidth = w;
            ctexture.needsUpdate = true;
        },
        strokeStyle: function(style) {
            tctx.strokeStyle = style;
            ctexture.needsUpdate = true;
        },
        fillRect: function(x,y,w,h) {
            tctx.fillRect(xInterp.interp(x), yInterp.interp(y),
                          xInterp.scale(w),  yInterp.scale(h));
            ctexture.needsUpdate = true;
        },
        beginPath: function() { tctx.beginPath(); },
        closePath: function() { tctx.closePath(); },
        moveTo: function(x,y) {
            tctx.moveTo(xInterp.interp(x), yInterp.interp(y));
            ctexture.needsUpdate = true;
        },
        lineTo: function(x,y) {
            tctx.lineTo(xInterp.interp(x), yInterp.interp(y));
            ctexture.needsUpdate = true;
        },
        stroke: function() {
            tctx.stroke();
            ctexture.needsUpdate = true;
        },
        fill: function() {
            tctx.fill();
            ctexture.needsUpdate = true;
        },
        arc: function(x,y,r,a0,a1) {
            tctx.arc(xInterp.interp(x),
                     yInterp.interp(y),
                     xInterp.scale(r),
                     a0,a1);
            ctexture.needsUpdate = true;
        }
    };
}

module.exports = {
    TextureCanvas: TextureCanvas
};
