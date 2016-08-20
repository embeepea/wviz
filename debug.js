var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');

module.exports = {

    showMatrix: function(name, m) {
        console.log(name + ' =');
        this.logMatrix(m);
    },

    logMatrix: function(m) {
        console.log(sprintf("[ %10.4f  %10.4f  %10.4f  %10.4f\n" +
                            "  %10.4f  %10.4f  %10.4f  %10.4f\n" +
                            "  %10.4f  %10.4f  %10.4f  %10.4f\n" +
                            "  %10.4f  %10.4f  %10.4f  %10.4f ]\n",
                            m.elements[0],m.elements[4],m.elements[ 8],m.elements[12],
                            m.elements[1],m.elements[5],m.elements[ 9],m.elements[13],
                            m.elements[2],m.elements[6],m.elements[10],m.elements[14],
                            m.elements[3],m.elements[7],m.elements[11],m.elements[15]));
    },

    showVector3: function(name, v) {
        console.log(sprintf("%s = [ %10.4f, %10.4f, %10.4f ]",
                            name, v.x, v.y, v.z));
    },

    showVector4: function(name, v) {
        console.log(sprintf("%s = [ %10.4f, %10.4f, %10.4f, %10.4f ]",
                            name, v.x, v.y, v.z, v.w));
    },

    showScreenCoords: function(msg, x,y,z) {
        var S = (world.matrixWorld.clone()
                 .multiply((new THREE.Matrix4()).getInverse(camera.matrixWorld))
                 .multiply(camera.projectionMatrix));
        var v = (new THREE.Vector3(x,y,z)).applyMatrix4(S);
        console.log(sprintf("%s [%10.4f, %10.4f, %10.4f] => [%10.4f, %10.4f, %10.4f]",
                            msg, x, y, z, v.x, v.y, v.z));
    }

};
