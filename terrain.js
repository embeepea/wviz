var THREE = require('./libs/threejs/three.js');
var parseMesh = require('./mesh.js');
var sprintf = require('sprintf');
var arrow = require('./arrow.js');
var TextureCanvas = require('./texture_canvas.js');

function load(meshURL, settings, callback) {
    $.ajax({
        url: meshURL,
        dataType: 'text',
        success: function(data,status) {
            var m = parseMesh(data);
            var geom = new THREE.Geometry();
            var u, v, xy, tuv;
            var uvs = [];
            for (v=0; v<m.Nv; ++v) {
                for (u=0; u<m.Nu; ++u) {
                    xy = m.uv_to_xy([u,v]);
                    geom.vertices.push(new THREE.Vector3(xy[0], xy[1], m.meshData[u][v]));
                    tuv = [u/(m.Nu-1), 1-v/(m.Nv-1)];
                    uvs.push(new THREE.Vector2(tuv[0], tuv[1]));
                }
            }
            function vindex(u,v) {
                return v*m.Nv+u;
            }
            function faceVertexIndices(i0,j0, i1,j1, i2,j2) {
                return [vindex(i0,j0),vindex(i1,j1),vindex(i2,j2)];
            }
            function pushFace(vi) {
                geom.faces.push(new THREE.Face3(vi[0], vi[1], vi[2]));
                geom.faceVertexUvs[0].push([uvs[vi[0]], uvs[vi[1]], uvs[vi[2]]]);
            }
            geom.faceVertexUvs[0] = [];
            for (v=1; v<m.Nv; ++v) {
                for (u=1; u<m.Nu; ++u) {
                    pushFace(faceVertexIndices(u-1,v-1, u,v-1, u-1,v));
                    pushFace(faceVertexIndices(u,v-1,   u,v,   u-1,v));
                }
            }
            geom.uvsNeedUpdate = true;
            geom.computeFaceNormals();
            geom.computeVertexNormals();

            var terrainTextureContext =
                    TextureCanvas.TextureCanvas(settings.terrain.txSize,
                                                settings.terrain.txSize,
                                                m.xMin, m.xMax, m.yMin, m.yMax);
            var terrainMat = new THREE.MeshPhongMaterial( {
                map: terrainTextureContext.texture,
                //color: settings.terrain.diffuseColor,
                side: THREE.DoubleSide,
                shading: THREE.SmoothShading
            });

            var flatTextureContext =
                    TextureCanvas.TextureCanvas(settings.terrain.txSize,
                                                settings.terrain.txSize,
                                                m.xMin, m.xMax, m.yMin, m.yMax);
            var quadGeom = new THREE.Geometry();
            quadGeom.vertices.push(new THREE.Vector3(m.xMin, m.yMin, settings.terrain.latticeZ),
                                   new THREE.Vector3(m.xMin, m.yMax, settings.terrain.latticeZ),
                                   new THREE.Vector3(m.xMax, m.yMax, settings.terrain.latticeZ),
                                   new THREE.Vector3(m.xMax, m.yMin, settings.terrain.latticeZ));
            quadGeom.faces.push(new THREE.Face3(0,1,2));
            quadGeom.faces.push(new THREE.Face3(0,2,3));
            uvs = [
                new THREE.Vector2(0,1),
                new THREE.Vector2(0,0),
                new THREE.Vector2(1,0),
                new THREE.Vector2(1,1)
            ];
            quadGeom.faceVertexUvs[0] = [];
            quadGeom.faceVertexUvs[0].push([uvs[0], uvs[1], uvs[2]]);
            quadGeom.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);
            quadGeom.uvsNeedUpdate = true;
            quadGeom.computeFaceNormals();
            quadGeom.computeVertexNormals();
            var quadMat = new THREE.MeshBasicMaterial( {
                map: flatTextureContext.texture,
                side: THREE.DoubleSide,
                shading: THREE.SmoothShading
            });
            var quadMesh = new THREE.Mesh(quadGeom, quadMat);

            callback({
                faces: new THREE.Mesh( geom, terrainMat ),
                latticeQuad: quadMesh,
                m: m,
                terrainTextureContext: terrainTextureContext,
                flatTextureContext: flatTextureContext
            });
        }
    });
}

module.exports = {
    load: load
};
