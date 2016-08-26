/*
var commands = {
    "ae": toggleEdges,
    "af": toggleFaces,
    "aw": lineWidth,
    "l":  toggleLattice,
    "b":  toggleCurrentBoundary,
    " ":  advanceOnce,
    ".":  advanceAll
};
*/

function kbd_processor(commands, progressMsgFunc, actionMsgFunc) {
    var numericPrefixString = "";
    var currentString = "";
    var root = { 'char' : 'root' };
    var currentNode = root;
    function progressMsg() {
        if (progressMsgFunc) {
            progressMsgFunc(numericPrefixString + currentString);
        }
    }
    function actionMsg(n) {
        if (actionMsgFunc) {
            actionMsgFunc(numericPrefixString + currentString
                          + (currentNode.msgfunc ? (": " + currentNode.msgfunc(n)) : ""));
        }
    }
    var kp = {
        addCommand(cmd) {
            var cs = cmd.seq.split('');
            var node = root;
            cs.forEach(function(c) {
                if (!(c in node)) {
                    node[c] = { 'char': c };
                }
                node = node[c];
            });
            node.action = cmd.action;
            node.msgfunc = cmd.msgfunc;
        },
        key: function(c) {
            if (currentNode == root && c >= '0' && c <= '9') {
                numericPrefixString += c;
                progressMsg();
                return;
            }
            if (c in currentNode) {
                currentNode = currentNode[c];
                currentString += c;
                progressMsg();
                if (currentNode.action) {
                    if (numericPrefixString !== "") {
                        var n = parseInt(numericPrefixString,10);
                        currentNode.action(n);
                        actionMsg(n);
                    } else {
                        currentNode.action();
                        actionMsg();
                    }
                    numericPrefixString = "";
                    currentNode = root;
                    currentString = "";
                    return;
                }
            } else {
                progressMsg();
                if (currentNode !== root) {
                    numericPrefixString = "";
                    currentNode = root;
                    currentString = "";
                    this.key(c);
                }
            }
        }
    };
    commands.forEach(function(cmd) {
        if ("seq" in cmd) {
            kp.addCommand(cmd);
        }
    });
    return kp;
}

module.exports = kbd_processor;
