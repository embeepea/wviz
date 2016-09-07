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
                },
                getState: function() { return state.wviz.world.matrix; }
            }
        },
        //{
        //    //seq: undefined // no kbd seq for this one
        //    permalink: {
        //        key: "trs",
        //        urlKey: "trs",
        //        default: null,
        //        parse: parseUtils.parseTrails,
        //        toString: parseUtils.trailsToString,
        //        setState: function(trails) {
        //            state.wviz.setBlueTrails(trails);
        //        },
        //        getState: function() { return state.wviz.getBlueTrails(); }
        //    }
        //},
        {
            seq: "ct",
            action: function() {
                state.wviz.clearAllTrails();
                state.wviz.requestRender();
            },
            msgfunc: function() { return "clear all trails"; }
        },
        {
            seq: "dt",
            action: function() {
                state.nextClickDefinesYellowDotLocation = true;
            },
            msgfunc: function() { return "define target "; }
        },

        {
            seq: "ad",
            action: function() {
                state.wviz.visible("basePoints", !state.wviz.visible("basePoints"));
                state.permalink.set("basePoints", state.wviz.visible("basePoints"));
                state.permalink.updateWindowURL();
                state.wviz.requestRender();
            },
            msgfunc: function() { return "base points " + (state.wviz.visible("basePoints") ? "on" : "off"); },
            permalink: {
                key: "basePoints",
                urlKey: "ad",
                default: null,
                parse: parseUtils.parseBoolean,
                toString: parseUtils.booleanToString,
                setState: function(v) { state.wviz.visible("basePoints",v); },
                getState: function() { return state.wviz.visible("basePoints"); }
            }
        },
        {
            seq: "ah",
            action: function() {
                state.wviz.visible("blueDropHeightLine", !state.wviz.visible("blueDropHeightLine"));
                state.permalink.set("blueDropHeightLine", state.wviz.visible("blueDropHeightLine"));
                state.permalink.updateWindowURL();
                state.wviz.requestRender();
            },
            msgfunc: function() { return "blue drop height line " + (state.wviz.visible("blueDropHeightLine") ? "on" : "off"); },
            permalink: {
                key: "blueDropHeightLine",
                urlKey: "ah",
                default: null,
                parse: parseUtils.parseBoolean,
                toString: parseUtils.booleanToString,
                setState: function(v) { state.wviz.visible("blueDropHeightLine",v); },
                getState: function() { return state.wviz.visible("blueDropHeightLine"); }
            }
        },

        {
            seq: "af",
            action: function() {
                state.wviz.visible("terrainFaces", !state.wviz.visible("terrainFaces"));
                state.permalink.set("terrainFaces", state.wviz.visible("terrainFaces"));
                state.permalink.updateWindowURL();
                state.wviz.requestRender();
            },
            msgfunc: function() { return "terrain faces " + (state.wviz.visible("terrainFaces") ? "on" : "off"); },
            permalink: {
                key: "terrainFaces",
                urlKey: "af",
                default: null,
                parse: parseUtils.parseBoolean,
                toString: parseUtils.booleanToString,
                setState: function(v) {
                    state.wviz.visible("terrainFaces",v);
                },
                getState: function() { return state.wviz.visible("terrainFaces"); }
            }
        },

        {
            seq: "am",
            action: function() {
                if (!state.displayMessages) {
                    state.displayMessages = true;
                    state.displayMessage("messages on");
                } else {
                    state.displayMessage("messages off");
                    state.displayMessages = false;
                }
            }
        },

        {
            seq: "sj",
            action: function(a) {
                if (a) {
                    state.wviz.transitionToState(state.keyStates[a], state.permalink);
                    state.currentKeyState = a;
                }
            },
            msgfunc: function() { return sprintf("jump to snapshot #%1d", state.currentKeyState); }
        },
        {
            seq: "sn",
            action: function(a) {
                if (state.currentKeyState && state.currentKeyState < state.keyStates.length-1) {
                    ++state.currentKeyState;
                    state.wviz.transitionToState(state.keyStates[state.currentKeyState], state.permalink);
                }
            },
            msgfunc: function() { return sprintf("next snapshot (#%1d)", state.currentKeyState); }
        },
        {
            seq: "sp",
            action: function(a) {
                if (state.currentKeyState && state.currentKeyState > 1) {
                    --state.currentKeyState;
                    state.wviz.transitionToState(state.keyStates[state.currentKeyState], state.permalink);
                }
            },
            msgfunc: function() { return sprintf("prev snapshot (#%1d)", state.currentKeyState); }
        },

        {
            seq: "ae",
            action: function() {
                state.wviz.visible("terrainEdges", !state.wviz.visible("terrainEdges"));
                state.permalink.set("terrainEdges", state.wviz.visible("terrainEdges"));
                state.permalink.updateWindowURL();
                state.wviz.requestRender();
            },
            msgfunc: function() { return "terrain edges " + (state.wviz.visible("terrainEdges") ? "on" : "off"); },
            permalink: {
                key: "terrainEdges",
                urlKey: "ae",
                default: null,
                parse: parseUtils.parseBoolean,
                toString: parseUtils.booleanToString,
                setState: function(v) { state.wviz.visible("terrainEdges",v); },
                getState: function() { return state.wviz.visible("terrainEdges"); }
            }
        },
        {
            seq: "aa",
            action: function() {
                state.wviz.visible("baseArrows", !state.wviz.visible("baseArrows"));
                state.permalink.set("baseArrows", state.wviz.visible("baseArrows"));
                state.permalink.updateWindowURL();
                state.wviz.requestRender();
            },
            msgfunc: function() { return "arrows " + (state.wviz.visible("baseArrows") ? "on" : "off"); },
            permalink: {
                key: "baseArrows",
                urlKey: "aa",
                default: null,
                parse: parseUtils.parseBoolean,
                toString: parseUtils.booleanToString,
                setState: function(v) { state.wviz.visible("baseArrows",v); },
                getState: function() { return state.wviz.visible("baseArrows"); }
            }
        },
        {
            seq: "at",
            action: function() {
                state.wviz.visible("d3", !state.wviz.visible("d3"));
                state.permalink.set("d3", state.wviz.visible("d3"));
                state.permalink.updateWindowURL();
                state.wviz.requestRender();
            },
            msgfunc: function() { return "3D " + (state.wviz.visible("d3") ? "on" : "off"); },
            permalink: {
                key: "d3",
                urlKey: "d3",
                default: null,
                parse: parseUtils.parseBoolean,
                toString: parseUtils.booleanToString,
                setState: function(v) { state.wviz.visible("d3",v); },
                getState: function() { return state.wviz.visible("d3"); }
            }
        },
        {
            seq: "ar",
            action: function() {
                state.wviz.visible("d2", !state.wviz.visible("d2"));
                state.permalink.set("d2", state.wviz.visible("d2"));
                state.permalink.updateWindowURL();
                state.wviz.requestRender();
            },
            msgfunc: function() { return "2D " + (state.wviz.visible("d2") ? "on" : "off"); },
            permalink: {
                key: "d2",
                urlKey: "d2",
                default: null,
                parse: parseUtils.parseBoolean,
                toString: parseUtils.booleanToString,
                setState: function(v) { state.wviz.visible("d2",v); },
                getState: function() { return state.wviz.visible("d2"); }
            }
        },


        {
            seq: "t",
            action: function() {
                state.mouseDragMode = "translate";
                state.permalink.set("dragMode", "translate");
                state.permalink.updateWindowURL();
            },
            msgfunc: function() { return "translate"; },
            permalink: {
                key: "dragMode",
                urlKey: "dm",
                default: null,
                parse: parseUtils.parseDragMode,
                toString: parseUtils.dragModeToString,
                setState: function(m) {
                    state.mouseDragMode = parseUtils.parseDragMode(m);
                },
                getState: function() { return state.mouseDragMode; }
            }
        },
        {
            seq: "r",
            action: function() {
                state.mouseDragMode = "rotate";
                state.permalink.set("dragMode", "rotate");
                state.permalink.updateWindowURL();
            },
            msgfunc: function() { return "rotate"; },
            permalink: {
                key: "dragMode",
                urlKey: "dm",
                default: null,
                parse: parseUtils.parseDragMode,
                toString: parseUtils.dragModeToString,
                setState: function(m) {
                    state.mouseDragMode = parseUtils.parseDragMode(m);
                },
                getState: function() { return state.mouseDragMode; }
            }
        },
        {
            seq: "ac",
            action: function() {
                state.wviz.visible("axes", !state.wviz.visible("axes"));
                state.permalink.set("axes", state.wviz.visible("axes"));
                state.permalink.updateWindowURL();
                state.wviz.requestRender();
            },
            msgfunc: function() { return "axes " + (state.wviz.visible("axes") ? "on" : "off"); },
            permalink: {
                key: "axes",
                urlKey: "ac",
                default: null,
                parse: parseUtils.parseBoolean,
                toString: parseUtils.booleanToString,
                setState: function(v) { state.wviz.visible("axes",v); },
                getState: function() { return state.wviz.visible("axes"); }
            }
        },
        {
            seq: "ag",
            action: function() {
                state.wviz.visible("gravityArrows", !state.wviz.visible("gravityArrows"));
                state.permalink.set("gravityArrows", state.wviz.visible("gravityArrows"));
                state.permalink.updateWindowURL();
                state.wviz.requestRender();
            },
            msgfunc: function() { return "gravity arrows " + (state.wviz.visible("gravityArrows") ? "on" : "off"); },
            permalink: {
                key: "gravityArrows",
                urlKey: "ag",
                default: null,
                parse: parseUtils.parseBoolean,
                toString: parseUtils.booleanToString,
                setState: function(v) { state.wviz.visible("gravityArrows",v); },
                getState: function() { return state.wviz.visible("gravityArrows"); }
            }
        },

        {
            //seq: undefined // no kbd seq for this one
            permalink: {
                key: "uv",
                urlKey: "uv",
                default: null,
                parse: parseUtils.parseIntArray,
                toString: parseUtils.intArrayToString,
                setState: state.wviz.setBlueUV,
                getState: state.wviz.getBlueUV
            }
        },

        {
            //seq: undefined // no kbd seq for this one
            permalink: {
                key: "yuv",
                urlKey: "yuv",
                default: null,
                parse: parseUtils.parseIntArray,
                toString: parseUtils.intArrayToString,
                setState: state.wviz.setYellowUV,
                getState: state.wviz.getYellowUV
            }
        },

        { seq: " ",
          action: function() {
              state.wviz.advanceDropOnce(state.dropFallStep);
              //state.permalink.set("trs", state.wviz.getBlueTrails());
              //state.permalink.updateWindowURL();
          },
          msgfunc: function() { return "advance once"; }
        },
        { seq: ".",
          action: function() {
              state.wviz.advanceAll(state.dropFallStep);
              //state.permalink.set("trs", state.wviz.getBlueTrails());
              //state.permalink.updateWindowURL();
          },
          msgfunc: function() { return "advance all"; } },


        { seq: "n",
          action: function() {
              if (state.wviz.neighborPoints) {
                  state.wviz.hideNeighborPoints();
              } else {
                  state.wviz.showNeighborPoints();
              }
              state.permalink.set("neighborPoints", !!state.wviz.neighborPoints);
              state.permalink.updateWindowURL();
          },
          msgfunc: function() { return "toggle neighbor points"; },
          permalink: {
              key: "neighborPoints",
              urlKey: "n",
              default: null,
              parse: parseUtils.parseBoolean,
              toString: parseUtils.booleanToString,
              setState: function(v) {
                  if (v) {
                      state.wviz.showNeighborPoints();
                  } else {
                      state.wviz.hideNeighborPoints();
                  }
              },
              getState: function() { return !!state.wviz.neighborPoints; }
          }
        },

        { seq: "h",
          action: function() {
              if (state.wviz.heightLines) {
                  state.wviz.hideHeightLines();
              } else {
                  state.wviz.showHeightLines();
              }
              state.permalink.set("heightLines", !!state.wviz.heightLines);
              state.permalink.updateWindowURL();
          },
          msgfunc: function() { return "toggle height lines"; },
          permalink: {
              key: "heightLines",
              urlKey: "h",
              default: null,
              parse: parseUtils.parseBoolean,
              toString: parseUtils.booleanToString,
              setState: function(v) {
                  if (v) {
                      state.wviz.showHeightLines();
                  } else {
                      state.wviz.hideHeightLines();
                  }
              },
              getState: function() { return !!state.wviz.heightLines; }
          }
        },

        { seq: "uu",
          action: function() {
              state.wviz.addCurrentYellowDropUpstreamArea();
              state.wviz.requestRender();
          },
          msgfunc: function() { return "add upstream"; }
        },

        { seq: "uc",
          action: function() {
              state.wviz.clearUpstreamAreas();
              state.wviz.requestRender();
          },
          msgfunc: function() { return "clear upstreams"; }
        },

        { seq: "x",
          action: function() {
              if (state.wviz.text) {
                  state.wviz.hideText();
              } else {
                  state.wviz.showText();
              }
              state.permalink.set("text", !!state.wviz.text);
              state.permalink.updateWindowURL();
          },
          msgfunc: function() { return "toggle text"; },
          permalink: {
              key: "text",
              urlKey: "x",
              default: null,
              parse: parseUtils.parseBoolean,
              toString: parseUtils.booleanToString,
              setState: function(v) {
                  if (v) {
                      state.wviz.showText();
                  } else {
                      state.wviz.hideText();
                  }
              },
              getState: function() { return !!state.wviz.text; }
          }
        },

        { seq: "fs",
          action: function(a) {
              if (a) {
                  state.dropFallStep = a;
                  state.permalink.set("fallStep", a);
                  state.permalink.updateWindowURL();
              }
          },
          msgfunc: function(n) { return sprintf("drop step set to %1d", n); },
          permalink: {
              key: "fallStep",
              urlKey: "fs",
              default: null,
              parse: parseUtils.parseIInt,
              toString: parseUtils.intToString,
              setState: function(a) {
                  state.dropFallStep = a;
              },
              getState: function() { return state.dropFallStep; }
          }
        },
        { seq: "fr",
          action: function(a) {
              if (a) {
                  state.wviz.setFallRate(a);
                  state.permalink.set("fallRate", a);
                  state.permalink.updateWindowURL();
              }
          },
          msgfunc: function(n) { return sprintf("drop fall rate set to %1d", n); },
          permalink: {
              key: "fallRate",
              urlKey: "fr",
              default: null,
              parse: parseUtils.parseIInt,
              toString: parseUtils.intToString,
              setState: function(a) {
                  state.wviz.setFallRate(a);
              },
              getState: function() { return state.wviz.getFallRate(); }
          }
        },
        { seq: "sss",
          action: function() {
              state.displayModalOverlay(JSON.stringify(state.constructState()));
          }
        },

//        {
//            //seq: undefined // no kbd seq for this one
//            permalink: {
//                key: "center",
//                urlKey: "c",
//                default: null,
//                parse: parseUtils.parseFloatArray,
//                toString: parseUtils.floatArrayToString,
//                //setState: function(c) { state.wviz.setCenter(c); } // using anon fn because state.wviz.setCenter not defined til later
//                setState: function(c) {
//                    if (c) {
//                        state.wviz.axes.position.set(c[0], c[1], c[2]);
//                    }
//                },
//                getState: function() {
//                    return [state.wviz.axes.position.x,
//                            state.wviz.axes.position.y,
//                            state.wviz.axes.position.z];
//                }
//            }
//        },
//        {
//            seq: "al",
//            action: function() {
//                state.visible["base"] = !state.visible["base"];
//                state.wviz.setBase(state.visible["base"]);
//                state.permalink.set("base", state.visible["base"]);
//                state.permalink.updateWindowURL();
//                state.wviz.requestRender();
//            },
//            msgfunc: function() { return "base " + (state.wviz.base.state.visible ? "on" : "off"); },
//            permalink: {
//                key: "base",
//                urlKey: "al",
//                default: null,
//                parse: parseUtils.parseBoolean,
//                toString: parseUtils.booleanToString,
//                setState: state.wviz.setBase
//            }
//        },
//        {
//            seq: "aa",
//            action: function() {
//                state.visible["baseArrows"] = !state.visible["baseArrows"];
//                state.wviz.setBaseArrows(state.visible["baseArrows"]);
//                state.permalink.set("baseArrows", state.visible["baseArrows"]);
//                state.permalink.updateWindowURL();
//                state.wviz.requestRender();
//            },
//            msgfunc: function() { return "base arrows " + (state.wviz.baseArrows.state.visible ? "on" : "off"); },
//            permalink: {
//                key: "baseArrows",
//                urlKey: "aa",
//                default: null,
//                parse: parseUtils.parseBoolean,
//                toString: parseUtils.booleanToString,
//                setState: state.wviz.setBaseArrows
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
