var sprintf = require('sprintf');

function lowestNeighborBelow(m,uv) {
    var u, v, z;
    var zMinUV = null;
    var zMin = m.meshData[uv[0]][uv[1]];
    for (u=uv[0]-1; u<=uv[0]+1; ++u) {
        for (v=uv[1]-1; v<=uv[1]+1; ++v) {
            if ((u!==uv[0] || v!==uv[1]) && m.inRange([u,v])) {
                z = m.meshData[u][v];
                if (z <= zMin) {
                    zMin = z;
                    zMinUV = [u,v];
                }
            }
        }
    }
    return zMinUV;
}

function invertFlow(m) {
    var invFlow = [];
    var u, v, row;
    for (u=0; u<m.Nu; ++u) {
        row = [];
        for (v=0; v<m.Nv; ++v) {
            row.push([]);
        }
        invFlow.push(row);
    }
    for (u=0; u<m.Nu; ++u) {
        for (v=0; v<m.Nv; ++v) {
            if (m.flow[u][v] !== null) {
                invFlow[m.flow[u][v][0]][m.flow[u][v][1]].push([u,v]);
            }
        }
    }
    m.invFlow = invFlow;
}

function flowMesh(m) {
    // add flow to existing mesh
    var u,v,flow = [], row, lowPoints = [];
    var n;
    for (u=0; u<m.Nu; u++) {
        row = [];
        for (v=0; v<m.Nu; v++) {
            row.push(null);
        }
        flow.push(row);
    }
    for (u=0; u<m.Nu; ++u) {
        for (v=0; v<m.Nv; ++v) {
            if (m.isEdge([u,v])) {
                flow[u][v] = null;
            } else {
                n = lowestNeighborBelow(m,[u,v]);
                if (n === null) {
                    flow[u][v] = null;
                    lowPoints.push([u,v]);
                } else {
                    flow[u][v] = n;
                }
            }
        }
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

function cycleNodes(m) {
    function key(uv) { return uv[0] + "," + uv[1]; }
    var marked = {};
    var onstack = {};
    var cNodes = [];
    function dfs(uv) {
        var k = key(uv);
        marked[k] = true;
        onstack[k] = true;
        var n = m.flow[uv[0]][uv[1]];
        if (n !== null) {
            var nk = key(n);
            if (onstack[nk]) {
                cNodes.push(uv);
            } else if (!marked[nk]) {
                dfs(n);
            }
        }
        onstack[k] = false;
    }
    var u, v, xy;
    for (u=0; u<m.Nu; ++u) {
        for (v=0; v<m.Nv; ++v) {
            if (!marked[key([u,v])]) {
                dfs([u,v]);
            }
        }
    }
    return cNodes;
}

function parseMesh(meshString) {
    var lines = meshString.split("\n");
    var dims = lines[1].split(/\s+/);
    var Nu = parseInt(dims[0],10);
    var Nv = parseInt(dims[1],10);
    var u, v, x, y, xMin, yMin, xMax, yMax;
    var meshData = [];
    var coords, row;
    var lineno = 2;
    for (u=0; u<Nu; u++) {
        row = [];
        for (v=0; v<Nu; v++) {
            row.push(null);
        }
        meshData.push(row);
    }

    for (v=0; v<Nv; v++) {
        for (u=0; u<Nu; u++) {
            coords = lines[lineno].split(/\s+/);
            x = parseFloat(coords[0]);
            y = parseFloat(coords[1]);
            if (typeof(xMax)==="undefined" || x > xMax) { xMax = x; } 
            if (typeof(xMin)==="undefined" || x < xMin) { xMin = x; } 
            if (typeof(yMax)==="undefined" || y > yMax) { yMax = y; } 
            if (typeof(yMin)==="undefined" || y < yMin) { yMin = y; } 
            meshData[u][v] = parseFloat(coords[2]);
            //row.push(parseFloat(coords[2]));
            ++lineno;
        }
        meshData.push(row);
    }
    var fx = (Nu-1) / (xMax - xMin);
    var fy = (Nv-1) / (yMax - yMin);
    var m = {
        Nu: Nu,
        Nv: Nv,
        xMax: xMax,
        xMin: xMin,
        yMax: yMax,
        yMin: yMin,
        isEdge: function(uv) {
            return (uv[0]===0 || uv[1]===0 || uv[0]===Nu-1 || uv[1]===Nv-1);
        },
        inRange: function(uv) {
            var i = uv[0];
            var j = uv[1];
            return i >= 0 && i < Nu && j >= 0 && j < Nv;
        },
        xy_to_uv: function(xy) {
            return [Math.round((xy[0] - xMin) * fx),
                    Math.round((xy[1] - yMin) * fy)];
        },
        uv_to_xy: function(uv) {
            return [uv[0]/fx + xMin,
                    uv[1]/fy + yMin];
        },
        meshData: meshData
    };
    var f = flowMesh(m);
    console.log(sprintf('mesh has %1d local minima', f.lowPoints.length));
    if (f.lowPoints.length === 0) {
        var cNodes = cycleNodes(m);
        console.log(sprintf("mesh flow has %1d cycles", cNodes.length));
    }
    return m;
}

module.exports = parseMesh;
