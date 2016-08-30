//{
//    var zOffset = 0.1;
//    var upoints = upStreamPoints(ij, wviz.m);
//    var mp = multiPolygonFromPoints(upoints, wviz.m, zOffset);
//    var redSurfaceMaterial = new THREE.MeshPhongMaterial({
//        color: 0xff0000,
//        side: THREE.DoubleSide,
//        shading: THREE.SmoothShading
//    });
//    if (wviz.upst) {
//        wviz.d3.remove(wviz.upst);
//    }
//    wviz.upst = multiPolygonToObj3(mp, redSurfaceMaterial);
//    wviz.d3.add(wviz.upst);
//}


function upStreamPoints(ij, m) {
    var points = [];
    var marked = {};
    function dfs(ij) {
        var key = ij[0] + "," + ij[1];
        if (marked[key]) { return; }
        marked[key] = true;
        points.push(ij);
        m.invFlow[ij[0]][ij[1]].forEach(dfs);
    }
    dfs(ij);
    return points;
}

function meshMidpoint(m, i0, j0, i1, j1) {
    var xy0 = m.ij_to_xy([i0,j0]);
    var xy1 = m.ij_to_xy([i1,j1]);
    var x = (xy0[0] + xy1[0])/2;
    var y = (xy0[1] + xy1[1])/2;
    var corners = [[i0,j0],[i1,j0],[i0,j1],[i1,j1]];
    var s = 0, n = 0;
    corners.forEach(function(ij) {
        if (m.inRange(ij)) {
            s += m.meshData[ij[1]][ij[0]];
            ++n;
        }
    });
    return [x,y,s/n];
}

function zOff(dz,v) {
    return [v[0], v[1], v[2]+dz];
}

// currentUpstreamOff = polygonOffFromPoints(upoints, m, 0.2);

function multiPolygonFromPoints(points, m, zOffset) {
    var mp = MultiPolygon();
    points.forEach(function(ij) {
        var i = ij[0];
        var j = ij[1];
        mp.addPolygon([zOff(zOffset,meshMidpoint(m,  i,j,  i-1,j-1)),
                       zOff(zOffset,meshMidpoint(m,  i,j,  i+1,j-1)),
                       zOff(zOffset,meshMidpoint(m,  i,j,  i+1,j+1))]);
        mp.addPolygon([zOff(zOffset,meshMidpoint(m,  i,j,  i+1,j+1)),
                       zOff(zOffset,meshMidpoint(m,  i,j,  i-1,j+1)),
                       zOff(zOffset,meshMidpoint(m,  i,j,  i-1,j-1))]);
    });
    return mp;
}

function multiPolygonToObj3(mp, mat) {
    var p = mp.polygons();
    var g = new THREE.Geometry();
    p.vertices.forEach(function(v) {
        g.vertices.push(new THREE.Vector3(v[0], v[1], v[2]));
    });
    p.faces.forEach(function(f) {
        if (f.length !== 3) {
            console.log(sprintf("warning: mp face has !=3 verts"));
        } else {
            g.faces.push(new THREE.Face3(f[0], f[1], f[2]));
        }
    });
    g.computeFaceNormals();
    g.computeFaceNormals();
    var mesh = new THREE.Mesh(g, mat);
    return mesh;
}

