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

            //// terrain faces:
            var terrainFaceGeom = new THREE.Geometry();
            var u, v, xy, tuv;
            var uvs = [];
            for (v=0; v<m.Nv; ++v) {
                for (u=0; u<m.Nu; ++u) {
                    xy = m.uv_to_xy([u,v]);
                    terrainFaceGeom.vertices.push(new THREE.Vector3(xy[0], xy[1], m.meshData[u][v]));
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
                terrainFaceGeom.faces.push(new THREE.Face3(vi[0], vi[1], vi[2]));
                terrainFaceGeom.faceVertexUvs[0].push([uvs[vi[0]], uvs[vi[1]], uvs[vi[2]]]);
            }
            terrainFaceGeom.faceVertexUvs[0] = [];
            for (v=1; v<m.Nv; ++v) {
                for (u=1; u<m.Nu; ++u) {
                    pushFace(faceVertexIndices(u-1,v-1, u,v-1, u-1,v));
                    pushFace(faceVertexIndices(u,v-1,   u,v,   u-1,v));
                }
            }
            terrainFaceGeom.uvsNeedUpdate = true;
            terrainFaceGeom.computeFaceNormals();
            terrainFaceGeom.computeVertexNormals();
            var terrainTextureContext =
                    TextureCanvas.TextureCanvas(settings.terrain.txSize,
                                                settings.terrain.txSize,
                                                m.xMin, m.xMax, m.yMin, m.yMax);
            var terrainMat = new THREE.MeshPhongMaterial( {
                map: terrainTextureContext.texture,
                side: THREE.DoubleSide,
                shading: THREE.SmoothShading
            });
            var terrainFaceObj = new THREE.Mesh(terrainFaceGeom, terrainMat);
            ////

            function zOffset(v, dz) {
                return new THREE.Vector3(v.x, v.y, v.z+dz);
            }
            function zSet(v, z) {
                return new THREE.Vector3(v.x, v.y, z);
            }
            var dz = 0;

            //// terrain edges:
            var terrainEdgeGeom = new THREE.Geometry();
            for (u=0; u<m.Nu; ++u) {
                for (v=1; v<m.Nv; ++v) {
                    terrainEdgeGeom.vertices.push(terrainFaceGeom.vertices[vindex(u,v-1)],
                                           terrainFaceGeom.vertices[vindex(u,v)]);
                }
            }
            for (u=1; u<m.Nu; ++u) {
                for (v=0; v<m.Nv; ++v) {
                    terrainEdgeGeom.vertices.push(terrainFaceGeom.vertices[vindex(u-1,v)],
                                           terrainFaceGeom.vertices[vindex(u,v)]);
                }
            }
            var edgeMat = new THREE.LineBasicMaterial({
                color: 0x000000,
                linewidth: settings.terrain.edgeLineWidth
            });
            var terrainEdgeObj = new THREE.LineSegments(terrainEdgeGeom, edgeMat);
            ////

            // //// base lines:
            // var baseLineGeom = new THREE.Geometry();
            // for (u=0; u<m.Nu; ++u) {
            //     for (v=1; v<m.Nv; ++v) {
            //         baseLineGeom.vertices.push(zSet(geom.vertices[vindex(u,v-1)], zL),
            //                                       zSet(geom.vertices[vindex(u,v)],zL));
            //     }
            // }
            // for (u=1; u<m.Nu; ++u) {
            //     for (v=0; v<m.Nv; ++v) {
            //         baseLineGeom.vertices.push(zSet(geom.vertices[vindex(u-1,v)],zL),
            //                                       zSet(geom.vertices[vindex(u,v)],zL));
            //     }
            // }
            // var baseLineMat = new THREE.LineBasicMaterial({
            //     color: settings.terrain.edgeColor,
            //     linewidth: settings.terrain.lineWidth
            // });
            // var baseLineObj = new THREE.LineSegments(baseLineGeom, baseLineMat);
            // ////


            //// base points:
            var basePointGeom = new THREE.Geometry();
            var r = 0.01;
            var k = 0;
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
            for (u=0; u<m.Nu; ++u) {
                for (v=0; v<m.Nv; ++v) {
                    xy = m.uv_to_xy([u,v]);
                    addCircle(basePointGeom, xy[0], xy[1], r, 12, settings.terrain.baseZLevel3);
                }
            }
            var basePointMat = new THREE.MeshBasicMaterial( {
                color: 0x000000,
                side: THREE.DoubleSide
            });
            var basePointObj = new THREE.Mesh(basePointGeom, basePointMat);
            ////

            //// base arrows:
            function makeBaseArrowObj(options) {
                if (!options) { options = {}; }
                var baseArrowGeom = new THREE.Geometry();
                var g = 0.02;
                var a = 0.020;
                var b = 0.010;
                var c = 0.003;
                k = 0;
                for (u=0; u<m.Nu; ++u) {
                    for (v=0; v<m.Nv; ++v) {
                        var nuv = m.flow[u][v];
                        if (nuv !== null) {
                            xy = m.uv_to_xy([u,v]);
                            var nxy = m.uv_to_xy(nuv);
                            var ar = (options.reverse
                                      ? arrow.garrow([nxy[0],nxy[1]], [xy[0],xy[1]], g, a, b, c)
                                      : arrow.garrow([xy[0],xy[1]], [nxy[0],nxy[1]], g, a, b, c));
                            ar.headFaces.forEach(function(p) {
                                baseArrowGeom.vertices.push(new THREE.Vector3(p[0][0],p[0][1],settings.terrain.baseZLevel3),
                                                            new THREE.Vector3(p[1][0],p[1][1],settings.terrain.baseZLevel3),
                                                            new THREE.Vector3(p[2][0],p[2][1],settings.terrain.baseZLevel3));
                                baseArrowGeom.faces.push(new THREE.Face3(k, k+1, k+2));
                                k += 3;
                            });
                            ar.shaftFaces.forEach(function(p) {
                                baseArrowGeom.vertices.push(new THREE.Vector3(p[0][0],p[0][1],settings.terrain.baseZLevel3),
                                                            new THREE.Vector3(p[1][0],p[1][1],settings.terrain.baseZLevel3),
                                                            new THREE.Vector3(p[2][0],p[2][1],settings.terrain.baseZLevel3));
                                baseArrowGeom.faces.push(new THREE.Face3(k, k+1, k+2));
                                k += 3;
                            });
                        }
                    }
                }
                var arrowMat = new THREE.MeshBasicMaterial( {
                    color: options.color,
                    side: THREE.DoubleSide
                });
                return new THREE.Mesh(baseArrowGeom, arrowMat);
            }
            var baseArrowObj = makeBaseArrowObj({color: 0x000000});
            var baseReverseArrowObj = makeBaseArrowObj({color: 0x660000, reverse: true});

            ////

            var flatTextureContext =
                    TextureCanvas.TextureCanvas(settings.terrain.txSize,
                                                settings.terrain.txSize,
                                                m.xMin, m.xMax, m.yMin, m.yMax);
            var quadGeom = new THREE.Geometry();
            quadGeom.vertices.push(new THREE.Vector3(m.xMin, m.yMin, settings.terrain.baseZLevel0),
                                   new THREE.Vector3(m.xMin, m.yMax, settings.terrain.baseZLevel0),
                                   new THREE.Vector3(m.xMax, m.yMax, settings.terrain.baseZLevel0),
                                   new THREE.Vector3(m.xMax, m.yMin, settings.terrain.baseZLevel0));
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
            //var quadMat = new THREE.MeshBasicMaterial( {
            var quadMat = new THREE.MeshPhongMaterial( {
                map: flatTextureContext.texture,
                side: THREE.DoubleSide,
                shading: THREE.SmoothShading
            });
            var baseQuadObj = new THREE.Mesh(quadGeom, quadMat);

            callback({
                terrainFaces: terrainFaceObj,
                terrainEdges: terrainEdgeObj,
                baseFaces: baseQuadObj,
                basePoints: basePointObj,
                baseArrows: baseArrowObj,
                baseReverseArrows: baseReverseArrowObj,
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
