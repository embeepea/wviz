var parseUtils = require('./parseUtils.js');
var sprintf = require('sprintf');

module.exports = function(state) {

    return [
        {
            seq: "ccc",
            action: function() {
                window.location = ".";
            }
        },
        {
            //seq: undefined // no kbd seq for this one
            permalink: {
                key: "mm",
                urlKey: "mm",
                default: null,
                parse: parseUtils.parseMatrix4,
                toString: parseUtils.matrix4ToString,
                setState: function(m) {
                    if (m) {
                        state.wviz.world.matrix.copy(m);
                        state.wviz.world.matrixWorldNeedsUpdate = true;
                    }
                }
            }
        },
        {
            //seq: undefined // no kbd seq for this one
            permalink: {
                key: "center",
                urlKey: "c",
                default: null,
                parse: parseUtils.parseFloatArray,
                toString: parseUtils.floatArrayToString,
                //setState: function(c) { state.wviz.setCenter(c); } // using anon fn because state.wviz.setCenter not defined til later
                setState: function(c) {
                    if (c) {
                        state.wviz.axes.position.set(c[0], c[1], c[2]);
                    }
                }
            }
        },

//        {
//            seq: "at",
//            action: function() {
//                state.visible["d3"] = !state.visible["d3"];
//                state.wviz.set3D(state.visible["d3"]);
//                state.permalink.set("d3", state.visible["d3"]);
//                state.permalink.updateWindowURL();
//                state.wviz.requestRender();
//            },
//            msgfunc: function() { return "3D " + (state.wviz.d3.state.visible ? "on" : "off"); },
//            permalink: {
//                key: "d3",
//                urlKey: "d3",
//                default: null,
//                parse: parseUtils.parseBoolean,
//                toString: parseUtils.booleanToString,
//                setState: state.wviz.set3D
//            }
//        },
//        {
//            seq: "ar",
//            action: function() {
//                state.visible["d2"] = !state.visible["d2"];
//                state.wviz.set2D(state.visible["d2"]);
//                state.permalink.set("d2", state.visible["d2"]);
//                state.permalink.updateWindowURL();
//                state.wviz.requestRender();
//            },
//            msgfunc: function() { return "2D " + (state.wviz.d2.state.visible ? "on" : "off"); },
//            permalink: {
//                key: "d2",
//                urlKey: "d2",
//                default: state.visible["d2"],
//                parse: parseUtils.parseBoolean,
//                toString: parseUtils.booleanToString,
//                setState: state.wviz.set2D
//            }
//        },
//        {
//            seq: "ae",
//            action: function() {
//                state.visible["edges"] = !state.visible["edges"];
//                state.wviz.setEdges(state.visible["edges"]);
//                state.permalink.set("edges", state.visible["edges"]);
//                state.permalink.updateWindowURL();
//                state.wviz.requestRender();
//            },
//            msgfunc: function() { return "edges " + (state.wviz.edges.state.visible ? "on" : "off"); },
//            permalink: {
//                key: "edges",
//                urlKey: "ae",
//                default: null,
//                parse: parseUtils.parseBoolean,
//                toString: parseUtils.booleanToString,
//                setState: state.wviz.setEdges
//            }
//        },
//        {
//            seq: "af",
//            action: function() {
//                state.visible["faces"] = !state.visible["faces"];
//                state.wviz.setFaces(state.visible["faces"]);
//                state.permalink.set("faces", state.visible["faces"]);
//                state.permalink.updateWindowURL();
//                state.wviz.requestRender();
//            },
//            msgfunc: function() { return "faces " + (state.wviz.faces.state.visible ? "on" : "off"); },
//            permalink: {
//                key: "faces",
//                urlKey: "af",
//                default: null,
//                parse: parseUtils.parseBoolean,
//                toString: parseUtils.booleanToString,
//                setState: state.wviz.setFaces
//            }
//        },
//        {
//            seq: "ac",
//            action: function() {
//                state.visible["axes"] = !state.visible["axes"];
//                state.wviz.setAxes(state.visible["axes"]);
//                state.permalink.set("axes", state.visible["axes"]);
//                state.permalink.updateWindowURL();
//                state.wviz.requestRender();
//            },
//            msgfunc: function() { return "axes " + (state.wviz.axes.state.visible ? "on" : "off"); },
//            permalink: {
//                key: "axes",
//                urlKey: "ac",
//                default: null,
//                parse: parseUtils.parseBoolean,
//                toString: parseUtils.booleanToString,
//                setState: state.wviz.setAxes
//            }
//        },
//        {
//            seq: "al",
//            action: function() {
//                state.visible["lattice"] = !state.visible["lattice"];
//                state.wviz.setLattice(state.visible["lattice"]);
//                state.permalink.set("lattice", state.visible["lattice"]);
//                state.permalink.updateWindowURL();
//                state.wviz.requestRender();
//            },
//            msgfunc: function() { return "lattice " + (state.wviz.lattice.state.visible ? "on" : "off"); },
//            permalink: {
//                key: "lattice",
//                urlKey: "al",
//                default: null,
//                parse: parseUtils.parseBoolean,
//                toString: parseUtils.booleanToString,
//                setState: state.wviz.setLattice
//            }
//        },
//        {
//            seq: "aa",
//            action: function() {
//                state.visible["latticeArrows"] = !state.visible["latticeArrows"];
//                state.wviz.setLatticeArrows(state.visible["latticeArrows"]);
//                state.permalink.set("latticeArrows", state.visible["latticeArrows"]);
//                state.permalink.updateWindowURL();
//                state.wviz.requestRender();
//            },
//            msgfunc: function() { return "lattice arrows " + (state.wviz.latticeArrows.state.visible ? "on" : "off"); },
//            permalink: {
//                key: "latticeArrows",
//                urlKey: "aa",
//                default: null,
//                parse: parseUtils.parseBoolean,
//                toString: parseUtils.booleanToString,
//                setState: state.wviz.setLatticeArrows
//            }
//        },
//        {
//            //seq: undefined // no kbd seq for this one
//            permalink: {
//                key: "ij",
//                urlKey: "ij",
//                default: null,
//                parse: parseUtils.parseIntArray,
//                toString: parseUtils.intArrayToString,
//                setState: state.wviz.setIJ
//            }
//        },
//        {
//            //seq: undefined // no kbd seq for this one
//            permalink: {
//                key: "dr",
//                urlKey: "dr",
//                default: null,
//                parse: parseUtils.parseFFloat,
//                toString: parseUtils.floatToString,
//                setState: function(r) {
//                    if (r) {
//                        state.wviz.settings.drop.radius = r;
//                        state.wviz.drop.setRadius(state.wviz.settings.drop.radius);
//                    }
//                }
//            }
//        },
//
//        {
//            seq: "aw",
//            action: function lineWidth(a) {
//                if (a) {
//                    state.wviz.setLineWidth(a);
//                    state.permalink.set("lineWidth", a);
//                    state.permalink.updateWindowURL();
//                    state.wviz.requestRender();
//                }
//            },
//            msgfunc: function() { return sprintf("line width = %1d", state.wviz.edges.material.linewidth); },
//            permalink: {
//                key: "lineWidth",
//                urlKey: "aw",
//                default: null,
//                parse: parseUtils.parseIInt,
//                toString: parseUtils.intToString,
//                setState: state.wviz.setLineWidth
//            }
//        },
//
//        {
//            seq: "t",
//            action: function() {
//                state.mouseDragMode = "translate";
//                state.permalink.set("dragMode", "translate");
//                state.permalink.updateWindowURL();
//            },
//            msgfunc: function() { return "translate"; },
//            permalink: {
//                key: "dragMode",
//                urlKey: "dm",
//                default: null,
//                parse: parseUtils.parseDragMode,
//                toString: parseUtils.dragModeToString,
//                setState: function(m) {
//                    state.mouseDragMode = parseUtils.parseDragMode(m);
//                }
//            }
//        },
//        {
//            seq: "r",
//            action: function() {
//                state.mouseDragMode = "rotate";
//                state.permalink.set("dragMode", "rotate");
//                state.permalink.updateWindowURL();
//            },
//            msgfunc: function() { return "rotate"; },
//            permalink: {
//                key: "dragMode",
//                urlKey: "dm",
//                default: null,
//                parse: parseUtils.parseDragMode,
//                toString: parseUtils.dragModeToString,
//                setState: function(m) {
//                    state.mouseDragMode = parseUtils.parseDragMode(m);
//                }
//            }
//        },
//
//        { seq: "fs",
//          action: function(a) {
//              if (a) {
//                  state.wviz.setFallSpeed(a);
//                  state.permalink.set("fallSpeed", a);
//                  state.permalink.updateWindowURL();
//              }
//          },
//          msgfunc: function(n) { return sprintf("speed set to %1d", n); },
//          permalink: {
//              key: "fallSpeed",
//              urlKey: "fs",
//              default: null,
//              parse: parseUtils.parseIInt,
//              toString: parseUtils.intToString,
//              setState: function(a) {
//                  state.wviz.setFallSpeed(a);
//              }
//          }
//        },
//
//        { seq: "n",
//          action: function() {
//              if (state.wviz.neighbors) {
//                  state.wviz.hideNeighbors();
//              } else {
//                  state.wviz.showNeighbors();
//              }
//              state.permalink.set("neighbors", !!state.wviz.neighbors);
//              state.permalink.updateWindowURL();
//          },
//          msgfunc: function() { return "toggle neighbor points"; },
//          permalink: {
//              key: "neighbors",
//              urlKey: "n",
//              default: null,
//              parse: parseUtils.parseBoolean,
//              toString: parseUtils.booleanToString,
//              setState: function(v) {
//                  if (v) {
//                      state.wviz.showNeighbors();
//                  }
//              }
//          }
//        },
//
//        { seq: "h",
//          action: function() {
//              if (state.wviz.heightLines) {
//                  state.wviz.hideHeightLines();
//              } else {
//                  state.wviz.showHeightLines();
//              }
//              state.permalink.set("heightLines", !!state.wviz.heightLines);
//              state.permalink.updateWindowURL();
//          },
//          msgfunc: function() { return "toggle height lines"; },
//          permalink: {
//              key: "heightLines",
//              urlKey: "h",
//              default: null,
//              parse: parseUtils.parseBoolean,
//              toString: parseUtils.booleanToString,
//              setState: function(v) {
//                  if (v) {
//                      state.wviz.showHeightLines();
//                  }
//              }
//          }
//        },
//
//        { seq: "x",
//          action: function() {
//              if (state.wviz.text) {
//                  state.wviz.hideText();
//              } else {
//                  state.wviz.showText();
//              }
//              state.permalink.set("text", !!state.wviz.text);
//              state.permalink.updateWindowURL();
//          },
//          msgfunc: function() { return "toggle text"; },
//          permalink: {
//              key: "text",
//              urlKey: "x",
//              default: null,
//              parse: parseUtils.parseBoolean,
//              toString: parseUtils.booleanToString,
//              setState: function(v) {
//                  if (v) {
//                      state.wviz.showText();
//                  }
//              }
//          }
//        },
//
//        { seq: "sw",
//          action: function() {
//              state.scaleTarget = "world";
//              state.permalink.set("scaleTarget", parseUtils.parseScaleTarget(state.scaleTarget));
//              state.permalink.updateWindowURL();
//          },
//          msgfunc: function() { return "scale world"; },
//          permalink: {
//              key: "scaleTarget",
//              urlKey: "st",
//              default: null,
//              parse: parseUtils.parseScaleTarget,
//              toString: parseUtils.scaleTargetToString,
//              setState: function(m) {
//                  if (m) {
//                      state.scaleTarget = parseUtils.parseScaleTarget(m);
//                  }
//              }
//          }
//        },
//        { seq: "sd",
//          action: function() {
//              state.scaleTarget = "drop";
//              state.permalink.set("scaleTarget", parseUtils.parseScaleTarget(state.scaleTarget));
//              state.permalink.updateWindowURL();
//          },
//          msgfunc: function() { return "scale drop"; },
//          permalink: {
//              key: "scaleTarget",
//              urlKey: "st",
//              default: null,
//              parse: parseUtils.parseScaleTarget,
//              toString: parseUtils.scaleTargetToString,
//              setState: function(m) {
//                  if (m) {
//                      state.scaleTarget = parseUtils.parseScaleTarget(m);
//                  }
//              }
//          }
//        },
//
//
//
//        { seq: " ",
//          action: state.wviz.advanceOnce,
//          msgfunc: function() { return "advance once"; } },
//        { seq: ".",
//          action: state.wviz.advanceAll,
//          msgfunc: function() { return "advance all"; } },
        
    ];

};
