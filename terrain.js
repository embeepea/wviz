var THREE = require('./libs/threejs/three.js');
var parseMesh = require('./mesh.js');
var sprintf = require('sprintf');
var arrow = require('./arrow.js');

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
            var latticeLineGeom = new THREE.Geometry();
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
                    latticeLineGeom.vertices.push(zSet(geom.vertices[vindex(i,j-1)], zL),
                                                  zSet(geom.vertices[vindex(i,j)],zL));
                }
            }
            for (i=1; i<m.N; ++i) {
                for (j=0; j<m.M; ++j) {
                    edgeGeom.vertices.push(zOffset(geom.vertices[vindex(i-1,j)],dz),
                                           zOffset(geom.vertices[vindex(i,j)],dz));
                    latticeLineGeom.vertices.push(zSet(geom.vertices[vindex(i-1,j)],zL),
                                                  zSet(geom.vertices[vindex(i,j)],zL));
                }
            }

            function addCircle(geom,x,y,r,n,z) {
                var a = Math.PI/4;
                var da = 2*Math.PI/n;
                var ps = [];
                var i;
                var k = geom.vertices.length;
                for (i=0; i<n; ++i) {
                    geom.vertices.push(new THREE.Vector3(x+r*Math.cos(a),y+r*Math.sin(a),z));
                    a += da;
                }
                for (i=0; i<n-2; ++i) {
                    geom.faces.push(new THREE.Face3(k, k+i+1, k+i+2));
                }
            }

            var latticePointGeom = new THREE.Geometry();
            var r = 0.01;
            var k = 0;
            for (i=0; i<m.N; ++i) {
                for (j=0; j<m.M; ++j) {
                    xy = m.ij_to_xy([i,j]);
                    addCircle(latticePointGeom, xy[0], xy[1], r, 12, zL);
                }
            }
            var terrainMat = new THREE.MeshPhongMaterial( {
                color: settings.terrain.diffuseColor,
                side: THREE.DoubleSide,
                shading: THREE.SmoothShading
            });
            geom.computeFaceNormals();
            geom.computeVertexNormals();

            var latticeArrowShaftGeom = new THREE.Geometry();
            var latticeArrowHeadGeom = new THREE.Geometry();
            var g = 0.02;
            var a = 0.020;
            var b = 0.010;
            var c = 0.003;
            k = 0;
            for (i=0; i<m.N; ++i) {
                for (j=0; j<m.M; ++j) {
                    var nij = m.flow[i][j];
                    if (nij !== null) {
                        xy = m.ij_to_xy([i,j]);
                        var nxy = m.ij_to_xy(nij);
                        var ar = arrow.garrow([xy[0],xy[1]], [nxy[0],nxy[1]], g, a, b, c);
                        ar.headFaces.forEach(function(p) {
                            latticeArrowHeadGeom.vertices.push(new THREE.Vector3(p[0][0],p[0][1],zL),
                                                               new THREE.Vector3(p[1][0],p[1][1],zL),
                                                               new THREE.Vector3(p[2][0],p[2][1],zL));
                            latticeArrowHeadGeom.faces.push(new THREE.Face3(k, k+1, k+2));
                            k += 3;
                        });
                        ar.shaftFaces.forEach(function(p) {
                            latticeArrowHeadGeom.vertices.push(new THREE.Vector3(p[0][0],p[0][1],zL),
                                                               new THREE.Vector3(p[1][0],p[1][1],zL),
                                                               new THREE.Vector3(p[2][0],p[2][1],zL));
                            latticeArrowHeadGeom.faces.push(new THREE.Face3(k, k+1, k+2));
                            k += 3;
                        });
                    }
                }
            }

            var edgeMat = new THREE.LineBasicMaterial({
                color: settings.terrain.edgeColor,
                linewidth: settings.terrain.lineWidth
            });
            var latticeLineMat = new THREE.LineBasicMaterial({
                color: settings.terrain.edgeColor,
                linewidth: settings.terrain.lineWidth
            });
            var latticePointMat = new THREE.MeshBasicMaterial( {
                color: 0x000000,
                side: THREE.DoubleSide
            });

            var latticeArrowObj = new THREE.Object3D();
            latticeArrowObj.add(new THREE.LineSegments(latticeArrowShaftGeom, latticeLineMat));
            latticeArrowObj.add(new THREE.Mesh(latticeArrowHeadGeom, latticePointMat));
            
            var quadGeom = new THREE.Geometry();
            quadGeom.vertices.push(new THREE.Vector3(m.xMin, m.yMin, zL),
                                   new THREE.Vector3(m.xMin, m.yMax, zL),
                                   new THREE.Vector3(m.xMax, m.yMax, zL),
                                   new THREE.Vector3(m.xMax, m.yMin, zL));
            quadGeom.faces.push(new THREE.Face3(0,1,2));
            quadGeom.faces.push(new THREE.Face3(0,2,3));
            var quadMat = new THREE.MeshBasicMaterial( {
                color: 0xff0000,
                opacity: 0,
                transparent: true,
                side: THREE.DoubleSide
            });
            var quadMesh = new THREE.Mesh(quadGeom, quadMat);
            callback({
                faces: new THREE.Mesh( geom, terrainMat ),
                edges: new THREE.LineSegments(edgeGeom, edgeMat),
                latticeArrows: latticeArrowObj,
                //lattice: new THREE.LineSegments(latticeLineGeom, latticeLineMat),
                lattice: new THREE.Mesh(latticePointGeom, latticePointMat),
                latticeQuad: quadMesh,
                m: m
            });
        }
    });
}

module.exports = {
    load: load
};
