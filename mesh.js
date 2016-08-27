var sprintf = require('sprintf');

function grid_spiral_iterator(ij) {
    var p  = [ij[1], ij[0]];
    var dp = [-1, 0];
    var s = -1;
    var k = 0;
    var kMax = Math.floor((s+1)/2);
    return {
        next: function() {
            p = [p[0]+dp[0], p[1]+dp[1]];
            ++k;
            if (k > kMax) {
                k = 0;
                ++s;
                kMax = Math.floor((s+1)/2);
                dp = [dp[1], -dp[0]];
            }
            return [p[1],p[0]];
        },
        nextInRange(M,N) {
            var p;
            var n = 0;
            while (true) {
                p = this.next();
                if (p[0] >= 0 && p[0] < M && p[1] >= 0 && p[1] < N) {
                    return p;
                }
                ++n;
                if (n > 2*(N+M+1)) { return null; }
            }
        }
    };
}

function nextIJDown(startIJ, m) {
    var i = startIJ[0];
    var j = startIJ[1];
    var it = grid_spiral_iterator(startIJ);
    var ij, d, dPrev = null;
    var zCurrent = m.meshData[j][i];
    var zMinIJ, zMin = null;
    while (true) {
        ij = it.nextInRange(m.M, m.N);
        if (ij===null) { return null; }
        d = Math.max(Math.abs(ij[0]-i), Math.abs(ij[1]-j));
        if (dPrev != null && d > dPrev && zMin !== null) { break; }
        if (m.meshData[ij[1]][ij[0]] < zCurrent && (zMin===null || m.meshData[ij[1]][ij[0]] < zMin)) {
            zMin = m.meshData[ij[1]][ij[0]];
            zMinIJ = ij;
        }
        dPrev = d;
    }
    return zMinIJ;
}

function flowMesh(m) {
    // add flow to existing mesh
    var i,j;
    var flow = [], row;
    for (i=0; i<m.N; ++i) {
        row = [];
        for (j=0; j<m.M; ++j) {
            if (i===0 || j===0 || i===m.N-1 || j===m.M-1) {
                row.push(null);
            } else {
                row.push(nextIJDown([i,j], m));
            }
        }
        flow.push(row);
    }
    m.flow = flow;
    invertFlow(m);
}

function lowestNeighborBelow(m,ij) {
    var i, j, z;
    var zMinIJ = null;
    var zMin = m.meshData[ij[1]][ij[0]];
    for (i=ij[0]-1; i<=ij[0]+1; ++i) {
        for (j=ij[1]-1; j<=ij[1]+1; ++j) {
            if ((i!==ij[0] || j!==ij[1]) && m.inRange([i,j])) {
                z = m.meshData[j][i];
                if (z <= zMin) {
                    zMin = z;
                    zMinIJ = [i,j];
                }
            }
        }
    }
    return zMinIJ;
}

function lowestNeighbor(m,ij) {
    var i, j, z;
    var zMinIJ = null;
    var zMin = null;
    for (i=ij[0]-1; i<=ij[0]+1; ++i) {
        for (j=ij[1]-1; j<=ij[1]+1; ++j) {
            if ((i!==ij[0] || j!==ij[1]) && m.inRange([i,j])) {
                z = m.meshData[j][i];
                if (zMin === null || z < zMin) {
                    zMin = z;
                    zMinIJ = [i,j];
                }
            }
        }
    }
    return zMinIJ;
}

function ijSet(m) {
    var h = {};
    function key(ij) { return ij[0] + "," + ij[1]; }
    var s = {
        contains: function(ij) { return key(ij) in h; },
        add: function(ij) { h[key(ij)] = true; }
    };
    if (m) {
        m.forEach(function(ij) { s.add(ij); });
    }
    return s;
}

function lowestNeighborNotInSet(m,ij,s) {
    var i, j, z;
    var zMinIJ = null;
    var zMin = null;
    for (i=ij[0]-1; i<=ij[0]+1; ++i) {
        for (j=ij[1]-1; j<=ij[1]+1; ++j) {
            if ((i!==ij[0] || j!==ij[1]) && m.inRange([i,j]) && !s.contains([i,j])) {
                z = m.meshData[j][i];
                if (zMin === null || z < zMin) {
                    zMin = z;
                    zMinIJ = [i,j];
                }
            }
        }
    }
    return zMinIJ;
}

function neighborAverage(m,ij) {
    var i, j;
    var s = 0;
    var n = 0;
    for (i=ij[0]-1; i<=ij[0]+1; ++i) {
        for (j=ij[1]-1; j<=ij[1]+1; ++j) {
            if ((i!==ij[0] || j!==ij[1]) && m.inRange([i,j])) {
                s += m.meshData[j][i];
                ++n;
            }
        }
    }
    return s/n;
}

function cycleNodes(m) {
    function key(ij) { return ij[0] + "," + ij[1]; }
    var marked = {};
    var onstack = {};
    var cNodes = [];
    function dfs(ij) {
        var k = key(ij);
        marked[k] = true;
        onstack[k] = true;
        var n = m.flow[ij[0]][ij[1]];
        if (n !== null) {
            var nk = key(n);
            if (onstack[nk]) {
                cNodes.push(ij);
            } else if (!marked[nk]) {
                dfs(n);
            }
        }
        onstack[k] = false;
    }
    var i, j, xy;
    for (i=0; i<m.N; ++i) {
        for (j=0; j<m.M; ++j) {
            if (!marked[key([i,j])]) {
                dfs([i,j]);
            }
        }
    }
    return cNodes;
}

function flowMesh2(m) {
    // add flow to existing mesh
    var i,j,flow = [], row, lowPoints = [];
    var n;
    for (i=0; i<m.N; ++i) {
        row = [];
        for (j=0; j<m.M; ++j) {
            if (m.isEdge([i,j])) {
                row.push(null);
            } else {
                n = lowestNeighborBelow(m,[i,j]);
                if (n === null) {
                    row.push(null);
                    lowPoints.push([i,j]);
                } else {
                    row.push(n);
                }
            }
        }
        flow.push(row);
    }
    m.flow = flow;
    m.lowPoints = lowPoints;
    if (lowPoints.length === 0) {
        invertFlow(m);
    }
    return {
        flow: flow,
        lowPoints: lowPoints
    };
}

function invertFlow(m) {
    var invFlow = [];
    var i, j, row;
    for (i=0; i<m.N; ++i) {
        row = [];
        for (j=0; j<m.M; ++j) {
            row.push([]);
        }
        invFlow.push(row);
    }
    for (i=0; i<m.N; ++i) {
        for (j=0; j<m.M; ++j) {
            if (m.flow[i][j] !== null) {
                invFlow[m.flow[i][j][0]][m.flow[i][j][1]].push([i,j]);
            }
        }
    }
    m.invFlow = invFlow;
}

function parseMesh(meshString) {
    var lines = meshString.split("\n");
    var dims = lines[1].split(/\s+/);
    var N = parseInt(dims[0],10);
    var M = parseInt(dims[1],10);
    var i, j, x, y, xMin, yMin, xMax, yMax;
    var meshData = [];
    var n = 2;
    var coords;
    for (j=0; j<M; j++) {
        var row = [];
        for (i=0; i<N; i++) {
            coords = lines[n].split(/\s+/);
            x = parseFloat(coords[0]);
            y = parseFloat(coords[1]);
            if (typeof(xMax)==="undefined" || x > xMax) { xMax = x; } 
            if (typeof(xMin)==="undefined" || x < xMin) { xMin = x; } 
            if (typeof(yMax)==="undefined" || y > yMax) { yMax = y; } 
            if (typeof(yMin)==="undefined" || y < yMin) { yMin = y; } 
            row.push(parseFloat(coords[2]));
            ++n;
        }
        meshData.push(row);
    }
    var fx = (N-1) / (xMax - xMin);
    var fy = (M-1) / (yMax - yMin);
    var m = {
        N: N,
        M: M,
        xMax: xMax,
        xMin: xMin,
        yMax: yMax,
        yMin: yMin,
        meshString: meshString,
        meshData: meshData,
        isEdge(ij) {
            return (ij[0]===0 || ij[1]===0 || ij[0]===m.N-1 || ij[1]===m.M-1);
        },
        xy_to_ij: function(p) {
            return [Math.round((p[0] - xMin) * fx),
                    Math.round((p[1] - yMin) * fy)];
        },
        ij_to_xy: function(ij) {
            return [ij[0]/fx + xMin,
                    ij[1]/fy + yMin];
        },
        inRange(ij) {
            var i = ij[0];
            var j = ij[1];
            return i >= 0 && i < N && j >= 0 && j < M;
        },
        grMesh: function(z) {
            var lines = [];
            lines.push("MESH");
            lines.push(sprintf("%1d %1d", N, M));
            var i, j, xy;
            for (i=0; i<N; ++i) {
                for (j=0; j<M; ++j) {
                    xy = this.ij_to_xy([i,j]);
                    lines.push(sprintf("%f %f %f", xy[0], xy[1], z));
                }
            }
            return lines.join("\n");
        },
        cycleNodes: function() {
            return cycleNodes(this);
        },
        flowMesh2: function() {
            return flowMesh2(m);
        },
        grLines: function(z) {
            var D = 20;
            var segments = [];
            var xy;
            for (i=0; i<N; i += D) {
                for (j=0; j<M; j += D) {
                    xy = this.ij_to_xy([i,j]);
                    segments.push([sprintf("%f %f %f", xy[0], xy[1], meshData[j][i]),
                                   sprintf("%f %f %f", xy[0], xy[1], z)]);
                }
            }
            var lines = ["VECT"];
            lines.push(sprintf("%1d %1d %1d", segments.length, 2*segments.length, 0));
            lines.push(segments.map(function(s) { return s.length; }).join(" "));  // Num verts in each polyline
            lines.push(segments.map(function(s) { return 0; }).join(" "));         // Num colors in each polyline
            segments.forEach(function(s) {
                lines.push(s[0]);
                lines.push(s[1]);
            });
            return lines.join("\n");
        }
    };
    var f = flowMesh2(m);
    console.log(sprintf('mesh has %1d local minima', f.lowPoints.length));
    if (f.lowPoints.length === 0) {
        var cNodes = cycleNodes(m);
        console.log(sprintf("mesh flow has %1d cycles", cNodes.length));
    }
    return m;
}

module.exports = parseMesh;
