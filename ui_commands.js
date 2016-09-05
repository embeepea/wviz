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
        {
            //seq: undefined // no kbd seq for this one
            permalink: {
                key: "trs",
                urlKey: "trs",
                default: null,
                parse: parseUtils.parseTrails,
                toString: parseUtils.trailsToString,
                setState: function(trails) {
                    state.wviz.setBlueTrails(trails);
                },
                getState: function() { return state.wviz.getBlueTrails(); }
            }
        },

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
            seq: "v",
            action: function(a) {
                var states = [
                    null,
                    // 1: initial view of terrain from above:
                    {"mm":"1.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000,1.0000","ad":"1","ah":"0","af":"1","ae":"0","aa":"0","d3":"1","d2":"0","dm":"r","ac":"0","uv":"","yuv":"","n":"0","h":"0","x":"0","fs":"1","fr":"100"},

                    // 2: close-up of single drop near edge, showing grid below and single height line
                    {"mm":"1.8520,0.1935,1.0073,7.9039,-0.3381,2.0780,0.2224,1.6035,-0.9684,-0.3554,1.8487,-3.5956,0.0000,0.0000,0.0000,1.0000","ad":"1","ah":"1","af":"1","ae":"1","aa":"0","d3":"1","d2":"1","dm":"r","ac":"0","uv":"4,103","yuv":"","n":"0","h":"0","x":"0","fs":"1","fr":"100"},

                    // 3: closer close-up of same point, with neighbor points and height lines turned on
                    {"mm":"2.9884,0.2415,1.4265,19.4095,-0.4420,3.2695,0.3724,2.2451,-1.3776,-0.5251,2.9749,-7.2743,0.0000,0.0000,0.0000,1.0000","ad":"1","ah":"1","af":"1","ae":"1","aa":"0","d3":"1","d2":"1","dm":"t","ac":"0","uv":"4,103","yuv":"","n":"1","h":"1","x":"0","fs":"1","fr":"100"},

                    // 4:
                    {"mm":"2.9884,0.2415,1.4265,19.4095,-0.4420,3.2695,0.3724,2.2451,-1.3776,-0.5251,2.9749,-7.2743,0.0000,0.0000,0.0000,1.0000","trs":"4,103,2;4,103,1","ad":"1","ah":"1","af":"1","ae":"1","aa":"0","d3":"1","d2":"1","dm":"t","ac":"0","uv":"3,102","yuv":"","n":"1","h":"1","x":"0","fs":"1","fr":"100"}

/*
                    {"mm":"3.0306,0.4557,1.2771,17.1629,-0.6085,3.2515,0.2838,-5.7529,-1.2118,-0.4932,3.0515,-10.9077,0.0000,0.0000,0.0000,1.0000","c":"-9.2428,0.3448,1.2775","ad":"1","ah":"1","af":"0","ae":"1","aa":"0","d3":"1","d2":"0","dm":"r","ac":"0","uv":"","yuv":"","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
                    {"mm":"0.7970,0.0971,-0.5959,7.5708,-0.1611,0.9855,-0.0550,-2.2737,0.5819,0.1397,0.8011,-9.2766,0.0000,0.0000,0.0000,1.0000","c":"-2.7809,-4.5933,2.2342","ad":"1","ah":"1","af":"1","ae":"0","aa":"0","d3":"1","d2":"0","dm":"r","ac":"0","uv":"","yuv":"","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
                    {"mm":"7.4444,1.2414,3.1166,71.4568,-1.7511,7.9099,1.0305,-30.3930,-2.8610,-1.6090,7.4769,-32.2109,0.0000,0.0000,0.0000,1.0000","c":"-9.5462,1.9513,-0.5000","ad":"1","ah":"1","af":"1","ae":"1","aa":"0","d3":"1","d2":"1","dm":"r","ac":"0","uv":"2,148","yuv":"","n":"0","h":"0","x":"0","fs":"1","fr":"100"},
                    {"mm":"15.7599,2.6281,6.5979,149.2069,-3.7070,16.7452,2.1816,-66.4220,-6.0567,-3.4063,15.8285,-54.6619,0.0000,0.0000,0.0000,1.0000","c":"-9.4724,2.0571,-0.5000","ad":"1","ah":"1","af":"1","ae":"1","aa":"0","d3":"1","d2":"1","dm":"r","ac":"0","uv":"2,148","yuv":"","n":"1","h":"1","x":"0","fs":"1","fr":"100"}
*/


//                    {
//                        c:"-1.4394,-0.4492,1.0447",
//                        mm:"3.6769,0.3449,1.4969,2.3434,-0.5161,3.9348,0.3610,-0.3343,-1.4469,-0.5270,3.6753,-6.8310,0.0000,0.0000,0.0000,1.0000",
//                        ae:"1",
//                        af:"1",
//                        d2:"0",
//                        x:"0"
//                    }, {
//                        c:"-9.8512,1.8242,0.2726",
//                        mm:"3.3279,-0.3770,2.1592,23.0723,0.5776,3.9376,-0.2027,-0.3018,-2.1144,0.4822,3.3430,-13.3952,0.0000,0.0000,0.0000,1.0000",
//                        ae:"1",
//                        af:"1",
//                        d2:"1",
//                        dm:"t",
//                        uv:"2,147",
//                        n:"0",
//                        h:"0",
//                        x:"0"
//                    }, {
//                        c:"-9.7789,1.7279,-0.5000",
//                        mm:"4.9400,-1.3855,3.5684,41.2550,2.1111,5.8459,-0.6528,10.8209,-3.1933,1.7214,5.0888,-25.2157,0.0000,0.0000,0.0000,1.0000",
//                        ae:"1",
//                        af:"1",
//                        d2:"1",
//                        dm:"r",
//                        uv:"2,147",
//                        n:"1",
//                        h:"1",
//                        x:"0"
//                    }, {
//                        c:"-9.8399,1.8007,-0.5000",
//                        mm:"13.4252,-0.9380,-11.7401,117.8540,1.3229,17.8097,0.0897,-18.1236,11.7031,-0.9373,13.4572,133.1182,0.0000,0.0000,0.0000,1.0000",
//                        ae:"1",
//                        af:"1",
//                        d2:"1",
//                        dm:"r",
//                        uv:"2,147",
//                        n:"1",
//                        h:"0",
//                        ah:"0",
//                        x:"1"
//                    }
                ];
                if (a) {
                    state.wviz.transitionToState(states[a], state.permalink);
                }
            }
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
              state.permalink.set("trs", state.wviz.getBlueTrails());
              state.permalink.updateWindowURL();
          },
          msgfunc: function() { return "advance once"; }
        },
        { seq: ".",
          action: function() {
              state.wviz.advanceAll(state.dropFallStep);
              state.permalink.set("trs", state.wviz.getBlueTrails());
              state.permalink.updateWindowURL();
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
