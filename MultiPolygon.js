var set = require('./set.js');
var sprintf = require('sprintf');

function MultiPolygon() {
    var verts = [];
    var vertHash = {};
    var faces = [];
    function vkey(v) {
        return sprintf("%.4f,%.4f", v[0], v[1]);
    }
    return {
        addPolygon: function(vs) {
            var face = [];
            vs.forEach(function(v) {
                var key = vkey(v);
                if (!(key in vertHash)) {
                    vertHash[key] = verts.length;
                    verts.push(v);
                }
                face.push(vertHash[key]);
            });
            faces.push(face);
        },
        polygons: function() {
            return {
                vertices: verts,
                faces: faces
            };
        },
        bdy: function() {
            function edge(u,v) {
                // Return a string like "e[u,v]" representing an edge between
                // vertices u and v.  u and v should be strings.  Their values
                // are sorted (lexigraphically) in the returned representation,
                // so edge(u,v) and edge(v,u) will return the same string.
                if (v<u) { return edge(v,u); }
                return "e[" + u + "," + v + "]";
            }
            function edgeVerts(e) {
                // return an array of the two vertices in an edge, as strings
                var i0 = e.indexOf('[');
                var i1 = e.indexOf(',');
                var i2 = e.indexOf(']');
                return [e.substr(i0+1,i1-i0-1), e.substr(i1+1,i2-i1-1)];
            }
            function otherEdgeVert(e,w) {
                // given an edge e and one of its verts, return the other vert
                var uv = edgeVerts(e);
                if (w === uv[0]) {
                    return uv[1];
                } else {
                    return uv[0];
                }
            }

            // construct the vertex->edge mapping; keys of 'vert_edges' are verts,
            // each value is a set of non-shared edges containing that vert (eliminate
            // shared edges along the way)
            var vert_edges = {};
            faces.forEach(function(f) {
                // face f is a list of vertex indices
                var i,j,e;
                // for each vertex index i in the list
                for (i=0; i<f.length; ++i) {
                    // let j be the successor vertex in the list (wrapping back to 0 at end)
                    //   so i,j is a pair of successive verts in the list, i.e. an edge of the face
                    j = (i+1)%(f.length);
                    // initialize the adj set for these two verts
                    if (!(f[i] in vert_edges)) { vert_edges[f[i]] = set(); }
                    if (!(f[j] in vert_edges)) { vert_edges[f[j]] = set(); }
                    e = edge(f[i],f[j]);
                    // add this edge to the edge sets for both verts, unless it is
                    // already present in them, in which case we remove it instead
                    if (vert_edges[f[i]].contains(e) /*|| vert_edges[f[j]].contains(e)*/) {
                        // note: only need to check contains for one vert
                        // edge seen before, so remove it from both
                        vert_edges[f[i]].delete(e);
                        vert_edges[f[j]].delete(e);
                    } else {
                        vert_edges[f[i]].add(e);
                        vert_edges[f[j]].add(e);
                    }
                }
            });
//console.log('vert_edges:');
//console.log(Object.keys(vert_edges).map(function(v) { return sprintf("%s: {%s}", v, vert_edges[v].members().join(",")); }));
            var marked = {}; // hash for marking edges
            var polylines = [];
            function first_unmarked(s) {
                // return the first "unmarked" edge from a set s of edges
                //   i.e. the first edge e in s such that marked[e] is not truthy
                var j, m = s.members();
                for (j=0; j<m.length; ++j) {
                    if (!marked[m[j]]) { return m[j]; }
                }
                return null;
            }
            Object.keys(vert_edges).forEach(function(v) {
                var e,u;
                while ((e=first_unmarked(vert_edges[v])) !== null) {
                    u = v;
                    var polyline = [u];
                    while (e !== null) {
                        u = otherEdgeVert(e,u);
                        polyline.push(u);
                        marked[e] = true;
                        e = first_unmarked(vert_edges[u]);
                    }
                    --polyline.length; // remove last vert from polyline, it's same as first
                    polylines.push(polyline);
                }
            });
            return {
                polylines: polylines.map(function(polyline) {
                    return polyline.map(function(vi) { return verts[parseInt(vi,10)]; });
                })
            };
        }

//        bdy: function() {
//            var adj = {};
//            faces.forEach(function(f) {
//                // face f is a list of vertex indices
//                var i,j;
//                // for each vertex index i in the list
//                for (i=0; i<f.length; ++i) {
//                    // let j be the successor vertex in the list (wrapping back to 0 at end)
//                    //   so i,j is a pair of successive verts in the list, i.e. an edge of the face
//                    j = (i+1)%(f.length);
//                    // initialize the adj set for these two verts
//                    if (!(f[i] in adj)) { adj[f[i]] = set(); }
//                    if (!(f[j] in adj)) { adj[f[j]] = set(); }
//
//                    // add connections in both directions between these two verts,
//                    // unless we've seen this edge before (i.e. the connections already
//                    // exist), in which case we remove those connections.
//                    if (adj[f[i]].contains(f[j])) {
//                        // edge seen before, so remove it
//                        adj[f[i]].delete(f[j]);
//                        adj[f[j]].delete(f[i]);
//                    } else {
//                        adj[f[i]].add(f[j]);
//                        adj[f[j]].add(f[i]);
//                    }
//                }
//            });
//console.log('at 1');
//console.log(Object.keys(adj).map(function(k) { return sprintf("%1s: {%s}", k, adj[k].members().join(",")); }));
//            var marked = {};
//            var polylines = [];
//            function first_unmarked(s) {
//                var j, m = s.members();
//                for (j=0; j<m.length; ++j) {
//                    if (!marked[m[j]]) { return m[j]; }
//                }
//                return null;
//            }
//            Object.keys(adj).forEach(function(i) {
//console.log(sprintf("key i=%s", i));
//                var j;
//                if (!marked[i]) {
//console.log(sprintf("  it's unmarked, starting a polyline with it"));
//                    var polyline = [];
//                    while (i !== null && !marked[i]) {
//                        polyline.push(i);
//                        marked[i] = true;
//console.log(sprintf("     marking i=%s", i));
//                        i = first_unmarked(adj[i]);
//console.log(sprintf("     next unmarked is i=%s", i));
//                    }
//                    polylines.push(polyline);
//                } else {
//console.log(sprintf("  already marked"));
//                }
//            });
//            return {
//                polylines: polylines.map(function(polyline) {
//                    return polyline.map(function(vi) { return verts[parseInt(vi,10)]; });
//                })
//            };
//            //var lines = ["VECT"];
//            //lines.push(sprintf("%1d %1d %1d", polylines.length,
//            //                   polylines.reduce(function(s,pl) {
//            //                       return s + pl.length + 1;
//            //                   }, 0),
//            //                   0));
//            //lines.push(polylines.map(function(pl) { return 1+pl.length; }).join(" "));
//            //lines.push(polylines.map(function(pl) { return 0; }).join(" "));
//            //polylines.forEach(function(polyline) {
//            //    var i, v;
//            //    for (i=0; i<=polyline.length; ++i) {
//            //        v = verts[parseInt(polyline[i % polyline.length],10)];
//            //        lines.push(sprintf("%f %f %f", v[0], v[1], v[2]));
//            //    }
//            //});
//            //return lines.join("\n");
//        }
//






    };
}

module.exports = MultiPolygon;
