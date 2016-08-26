var keyedSet = require('./keyedSet.js');
var THREE = require('./libs/threejs/three.js');

function rain(settings, m, d, freq) {
    var surfaceMaterial = new THREE.MeshPhongMaterial({
        color: 0x3333ff,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading
    });
    var drops = keyedSet();
    var rainObj = new THREE.Object3D();
    function drop(ij) {
        var geom = new THREE.SphereGeometry( 1, 16, 16 );
        var sphere = new THREE.Object3D();
        sphere.add( new THREE.Mesh( geom, surfaceMaterial ) );
        var container = new THREE.Object3D();
        container.add(sphere);
        container.scale.set(settings.drop.radius,settings.drop.radius,settings.drop.radius);
        var nullCount = 0;
        var d = {
            tobj: container,
            setPositionFromIJ: function() {
                var xy = m.ij_to_xy(ij);
                container.position.set(xy[0], xy[1], m.meshData[ij[1]][ij[0]]);
            },
            advance: function() {
                if (ij === null) {
                    ++nullCount;
                    return;
                }
                ij = m.flow[ij[0]][ij[1]];
                if (ij !== null) {
                    this.setPositionFromIJ();
                }
            },
            nullCount: function() { return nullCount; }
        };
        d.setPositionFromIJ();
        return d;
    }
    var tickCount = 0;
    var r = {
        addDrop: function(ij) {
            var d = drop(ij);
            drops.add(d);
            rainObj.add(d.tobj);
        },
        tick: function() {
            var deadDrops = [];
            drops.forEach(function(d) {
                d.advance();
                if (d.nullCount > 10) { deadDrops.push(d); }
            });
            deadDrops.forEach(function(d) { drops.remove(d); });
            ++tickCount;
            if (tickCount % freq === 0) {
                //newDrops();
            }
        },
        tobj: rainObj
    };
    function newDrops() {
        var i,j;
        for (i=d; i<=m.N-d; i += d) {
            for (j=d; j<=m.M-d; j += d) {
                r.addDrop([i,j]);
            }
        }
    }
    newDrops();
    return r;
}

module.exports = {

    //beginRain(wviz.settings, state, wviz.settings.drop.fallSpeed);
    beginRain: function(settings, state, fallSpeed, requestRender) {
        state.rain = rain(settings, state.m, 10, 10);
        state.world.add(state.rain.tobj);
        requestRender();
        function rainTick() {
            state.rain.timeout = setTimeout(function() {
                state.rain.tick();
                requestRender();
                rainTick();
            }, fallSpeed);
        }
        rainTick();
    },

    endRain: function (state, requestRender) {
        if (state.rain && state.rain.timeout) {
            if (state.rain.timeout) {
                clearTimeout(state.rain.timeout);
            }
            state.world.remove(state.rain.tobj);
            state.rain = null;
            requestRender();
        }
    }

};
