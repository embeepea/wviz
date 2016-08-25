var THREE = require('./libs/threejs/three.js');
var parseMesh = require('./mesh.js');

function load(meshURL, settings, callback) {
    $.ajax({
        url: meshURL,
        dataType: 'text',
        success: function(data,status) {
            var m = parseMesh(data);

            var geom = new THREE.Geometry();
            var i, j, xy;
            for (i=0; i<m.N; ++i) {
                for (j=0; j<m.M; ++j) {
                    xy = m.ij_to_xy([i,j]);
                    geom.vertices.push(new THREE.Vector3(xy[0], xy[1], m.meshData[j][i]));
                }
            }
            function vindex(i,j) {
                return i*m.N+j;
            }
            function makeFace(i0,j0, i1,j1, i2,j2) {
                var vi0 = vindex(i0,j0);
                var vi1 = vindex(i1,j1);
                var vi2 = vindex(i2,j2);
                var v0 = geom.vertices[vi0];
                var v1 = geom.vertices[vi1];
                var v2 = geom.vertices[vi2];
                //return new THREE.Face3(vi0, vi1, vi2, faceNormal(v0,v1,v2));
                return new THREE.Face3(vi0, vi1, vi2);
            }
            function faceNormal(v0,v1,v2) {
                var a = new THREE.Vector3();
                var b = new THREE.Vector3();
                var n = new THREE.Vector3();
                a.subVectors(v1,v0);
                b.subVectors(v2,v0);
                n.crossVectors(a,b);
                n.normalize();
                return n;
            }
            for (i=1; i<m.N; ++i) {
                for (j=1; j<m.M; ++j) {
                    geom.faces.push(makeFace(i-1,j-1, i,j-1, i-1,j));
                    geom.faces.push(makeFace(i,j-1,   i,j,   i-1,j));
                }
            }
            var edgeGeom = new THREE.Geometry();
            var latticeGeom = new THREE.Geometry();
            function zOffset(v, dz) {
                return new THREE.Vector3(v.x, v.y, v.z+dz);
            }
            function zSet(v, z) {
                return new THREE.Vector3(v.x, v.y, z);
            }
            var dz = 0;
            var zL = settings.terrain.latticeZ;

            for (i=0; i<m.N; ++i) {
                for (j=1; j<m.M; ++j) {
                    edgeGeom.vertices.push(zOffset(geom.vertices[vindex(i,j-1)], dz),
                                           zOffset(geom.vertices[vindex(i,j)],dz));
                    latticeGeom.vertices.push(zSet(geom.vertices[vindex(i,j-1)], zL),
                                              zSet(geom.vertices[vindex(i,j)],zL));
                }
            }
            for (i=1; i<m.N; ++i) {
                for (j=0; j<m.M; ++j) {
                    edgeGeom.vertices.push(zOffset(geom.vertices[vindex(i-1,j)],dz),
                                           zOffset(geom.vertices[vindex(i,j)],dz));
                    latticeGeom.vertices.push(zSet(geom.vertices[vindex(i-1,j)],zL),
                                              zSet(geom.vertices[vindex(i,j)],zL));
                }
            }
            /*
            // lattice diagonals:
            for (i=1; i<m.N; ++i) {
                for (j=1; j<m.M; ++j) {
                    edgeGeom.vertices.push(zOffset(geom.vertices[vindex(i-1,j-1)],dz),
                                           zOffset(geom.vertices[vindex(i,j)],dz));
                    edgeGeom.vertices.push(zOffset(geom.vertices[vindex(i,j-1)],dz),
                                           zOffset(geom.vertices[vindex(i-1,j)],dz));
                    latticeGeom.vertices.push(zSet(geom.vertices[vindex(i-1,j-1)],zL),
                                              zSet(geom.vertices[vindex(i,j)],zL));
                    latticeGeom.vertices.push(zSet(geom.vertices[vindex(i,j-1)],zL),
                                              zSet(geom.vertices[vindex(i-1,j)],zL));
                }
            }
             */
            var material = new THREE.MeshPhongMaterial( {
                color: settings.terrain.diffuseColor,
                side: THREE.DoubleSide,
                shading: THREE.SmoothShading
            });
            geom.computeFaceNormals();
            geom.computeVertexNormals();
            var edgeMat = new THREE.LineBasicMaterial({
                color: settings.terrain.edgeColor,
                linewidth: settings.terrain.lineWidth
            });
            var latticeMat = new THREE.LineBasicMaterial({
                color: settings.terrain.edgeColor,
                linewidth: settings.terrain.lineWidth
            });
            callback({
                faces: new THREE.Mesh( geom, material ),
                edges: new THREE.LineSegments(edgeGeom, edgeMat),
                lattice: new THREE.LineSegments(latticeGeom, latticeMat),
                m: m
            });
        }
    });
}

module.exports = {
    load: load
};
