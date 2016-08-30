var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');

function ttest(wviz) {

    var width = 512;
    var height = 512;
    var tcanvas = document.createElement("canvas");
    tcanvas.width = width;
    tcanvas.height = height;
    var tctx = tcanvas.getContext('2d');
    tctx.clearRect(0, 0, tcanvas.width, tcanvas.height);
    tctx.fillStyle  = "#ff0000";
    tctx.strokeStyle  = "#0000ff";
    tctx.lineWidth = 5;
    tctx.fillRect(0,0,500,500);

    var g = new THREE.Geometry();
    g.vertices.push(new THREE.Vector3(-1,-1,0),
                    new THREE.Vector3(-1, 1,0),
                    new THREE.Vector3( 1, 1,0),
                    new THREE.Vector3( 1,-1,0));
    var uvs = [
        new THREE.Vector2(0,0),
        new THREE.Vector2(0,1),
        new THREE.Vector2(1,1),
        new THREE.Vector2(1,0)
    ];
    g.faces.push(new THREE.Face3(0,1,2),
                 new THREE.Face3(2,3,0));
    g.faceVertexUvs[0] = [];
    g.faceVertexUvs[0].push([uvs[0], uvs[1], uvs[2]]);
    g.faceVertexUvs[0].push([uvs[2], uvs[3], uvs[0]]);
    g.uvsNeedUpdate = true;
    g.computeFaceNormals();
    g.computeVertexNormals();

    var ctexture = new THREE.Texture( tcanvas );
    ctexture.needsUpdate = true;

    var mat = new THREE.MeshPhongMaterial({
        //map: texture,
        map: ctexture,
        //color: 0xff0000,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var mesh = new THREE.Mesh(g, mat);

    wviz.world.add(mesh);
    wviz.requestRender();

    setTimeout(function() {
        console.log('bla bla!');
        tctx.beginPath();
        tctx.moveTo(10,10);
        tctx.lineTo(490,10);
        tctx.lineTo(490,490);
        tctx.lineTo(10, 490);
        tctx.closePath();
        tctx.stroke();
        ctexture.needsUpdate = true;
        wviz.requestRender();
        setTimeout(function() {
            tctx.clearRect(0, 0, tcanvas.width, tcanvas.height);
            tctx.fillStyle  = "#0000ff";
            tctx.fillRect(0,0,500,500);
            ctexture.needsUpdate = true;
            wviz.requestRender();
        }, 1000);

    }, 2000);


}

module.exports = {
    ttest: ttest
};

