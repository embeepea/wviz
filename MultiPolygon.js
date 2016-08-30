var set = require('./set.js');
var sprintf = require('sprintf');

function MultiPolygon() {
    var verts = [];
    var vertHash = {};
    var faces = [];
    function vkey(v) {
        return sprintf("%.4f,%.4f,%.4f", v[0], v[1], v[2]);
    }
    function ekey(v1,v2) {
        return v1 + "," + v2;
    }
    return {
        addPolygon: function(vs) {
            var face = [];
            vs.forEach(function(v) {
                var key = vkey(v);
                if (!(key in vertHash)) {
                    verts.push(v);
                    vertHash[key] = verts.length-1;
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
        ooglString: function() {
            var lines = ["OFF"];
            lines.push(sprintf("%1d %1d 0", verts.length, faces.length));
            verts.forEach(function(v) {
                lines.push(sprintf("%f %f %f", v[0], v[1], v[2]));
            });
            faces.forEach(function(f) {
                lines.push(f.length + " " + f.join(" "));
            });
            return lines.join("\n");
        },
        bdy: function() {
            var adj = {};
            faces.forEach(function(f) {
                var i,j;
                for (i=0; i<f.length; ++i) {
                    j = (i+1)%(f.length);
                    if (!(f[i] in adj)) { adj[f[i]] = set(); }
                    if (!(f[j] in adj)) { adj[f[j]] = set(); }
                    if (adj[f[i]].contains(f[j])) {
                        // edge seen before, so remove it
                        adj[f[i]].delete(f[j]);
                        adj[f[j]].delete(f[i]);
                    } else {
                        adj[f[i]].add(f[j]);
                        adj[f[j]].add(f[i]);
                    }
                }
            });
//console.log(Object.keys(adj).map(function(k) { return sprintf("%1s: {%s}", k, adj[k].members().join(",")); }));
            var marked = {};
            var polylines = [];
            function first_unmarked(s) {
                var j, m = s.members();
                for (j=0; j<m.length; ++j) {
                    if (!marked[m[j]]) { return m[j]; }
                }
                return null;
            }
            Object.keys(adj).forEach(function(i) {
                var j;
                if (!marked[i]) {
                    var polyline = [];
                    while (i !== null && !marked[i]) {
                        polyline.push(i);
                        marked[i] = true;
                        i = first_unmarked(adj[i]);
                    }
                    polylines.push(polyline);
                }
            });
            return {
                polylines: polylines.map(function(polyline) {
                    return polyline.map(function(vi) { return verts[parseInt(vi,10)]; });
                })
            };
            //var lines = ["VECT"];
            //lines.push(sprintf("%1d %1d %1d", polylines.length,
            //                   polylines.reduce(function(s,pl) {
            //                       return s + pl.length + 1;
            //                   }, 0),
            //                   0));
            //lines.push(polylines.map(function(pl) { return 1+pl.length; }).join(" "));
            //lines.push(polylines.map(function(pl) { return 0; }).join(" "));
            //polylines.forEach(function(polyline) {
            //    var i, v;
            //    for (i=0; i<=polyline.length; ++i) {
            //        v = verts[parseInt(polyline[i % polyline.length],10)];
            //        lines.push(sprintf("%f %f %f", v[0], v[1], v[2]));
            //    }
            //});
            //return lines.join("\n");
        }
    };
}

module.exports = MultiPolygon;
