var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');

/*
 * Geomview-style transformation computation:
 * 
 * Takes 3 THREE.js objects: moving, center, and frame, and a 4x4 matrix L.
 * L is the matrix of a spatial transformation, expressed in the coordinate
 * system of the `frame` object translated so as to move its origin to the
 * origin of the `center` system.
 * 
 * Returns the 4x4 matrix representing the same transformation L, but expressed
 * in the coordinate system of the `moving` object.
 */
var Q     = new THREE.Matrix4();
var QInv  = new THREE.Matrix4();
var V     = new THREE.Matrix4();    
var TfInv = new THREE.Matrix4();    
var TmInv = new THREE.Matrix4();    
var P     = new THREE.Matrix4();    
var PInv  = new THREE.Matrix4();    
var computeTransform = function(moving, center, frame, L) {

    var Tm = moving.matrixWorld;
    var Tf = frame.matrixWorld;
    var Tc = center.matrixWorld;
    TfInv.getInverse(Tf);
    TmInv.getInverse(Tm);

    var ce = Tc.elements;
    var fe = Tf.elements;
    
    P.set(1, 0, 0, fe[12] - ce[12],
          0, 1, 0, fe[13] - ce[13],
          0, 0, 1, fe[14] - ce[14],
          0, 0, 0, 1);

    Q.identity();
    Q.multiply(TfInv);
    Q.multiply(P);
    Q.multiply(Tm);

    QInv.getInverse(Q);
    
    V.identity();
    V.multiply(QInv);
    V.multiply(L);
    V.multiply(Q);
    
    return V;
};


var EventTracker = function(domElement, handler) {

    var mouseIsDown = false;
    var lastP, lastDrag, lastTime;
    
    if (typeof(handler) === "undefined") {
        handler = {};
    }
    
    var relCoords = function(event) {
        return { x : event.pageX - domElement.offsetLeft,
                 y : event.pageY - domElement.offsetTop };
    };
    
    var mouseDown = function(event) {
        //console.log(event);
        //event.timeStamp;
        //event.shiftKey
        //event.clientX
        //event.clientY
        //event.button
        mouseIsDown = true;
        lastP = relCoords(event);
        lastTime = event.timeStamp;
        if (handler.mouseDown) {
            handler.mouseDown(lastP);
        }
        window.addEventListener('mousemove', mouseMove);
        window.addEventListener('mouseup', mouseUp);
    };
    
    var mouseMove = function(event) {
        var p = relCoords(event);
        var t = event.timeStamp;
        if (mouseIsDown) {
            lastDrag = { x : p.x - lastP.x, y : p.y - lastP.y };
            if (handler.mouseDrag) {
                handler.mouseDrag(p, lastDrag, event.button);
            }
            lastP = p;
            lastTime = t;
        }
    };
    var mouseUp = function(event) {
        var p = relCoords(event);
        var t = event.timeStamp;
        mouseIsDown = false;
        if (handler.mouseUp) {
            handler.mouseUp(p, t - lastTime, lastDrag, event);
        }
        lastP = p;
        lastTime = t;
        window.removeEventListener('mousemove', mouseMove);
        window.removeEventListener('mouseup', mouseUp);
    };
    var mouseWheel = function(event) {
        if (handler.mouseWheel) {
		    event.preventDefault();
		    event.stopPropagation();
		    var delta = 0;
		    if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9
			    delta = event.wheelDelta / 40;
		    } else if ( event.detail ) { // Firefox
			    delta = - event.detail / 3;
		    }
            var p = relCoords(event);
            handler.mouseWheel(delta, p);
        }
    };
    var touchStart = function(event) {
        mouseIsDown = true;
        lastP = relCoords(event.touches[0]);
        lastTime = event.timeStamp;
        if (handler.mouseDown) {
            handler.mouseDown(lastP);
        }
	    window.addEventListener( 'touchend',   touchEnd,   false );
	    window.addEventListener( 'touchmove',  touchMove,  false );
    };
    var touchMove = function(event) {
		event.preventDefault();
        var p = relCoords(event.touches[0]);
        var t = event.timeStamp;
        if (mouseIsDown) {
            lastDrag = { x : p.x - lastP.x, y : p.y - lastP.y };
            if (handler.mouseDrag) {
                handler.mouseDrag(p, lastDrag, 0);
            }
            lastP = p;
            lastTime = t;
        }
    };
    var touchEnd = function(event) {
        var p = relCoords(event.touches[0]);
        var t = event.timeStamp;
        mouseIsDown = false;
        if (handler.mouseUp) {
            handler.mouseUp(p, t - lastTime, lastDrag, 0);
        }
        lastP = p;
        lastTime = t;
        window.removeEventListener('touchmove', touchMove);
        window.removeEventListener('touchend', touchEnd);
    };
    var specialKeys = {
        'Tab': true,
        'Escape': true,
        'Delete': true,
        'Backspace': true
    };
    var keyPress = function(event) {
        if (!(event.key in specialKeys) && handler.keyPress) { handler.keyPress(event); }
    };
    var keyUp = function(event) {
        if (event.key in specialKeys && handler.keyPress) { handler.keyPress(event); }
    };

    window.addEventListener( 'keypress',   keyPress,  false );
    window.addEventListener( 'keyup',      keyUp,     false );
    domElement.addEventListener( 'mousedown',  mouseDown,  false );
	domElement.addEventListener( 'mousewheel', mouseWheel, false );

	domElement.addEventListener( 'touchstart', touchStart, false );

};

module.exports = {
    eventTracker: EventTracker,
    computeTransform: computeTransform
};
