// A utility object for constructing and extracting information from the
// application URL:

var sprintf = require('sprintf');

module.exports = function(url, commands) {
    var pl = {
        toString : function() { return url.toString(); },
        updateWindowURL : function() { window.history.replaceState({}, "", this.toString()); }
    };
    var vals = {};
    pl.commandsByUrlKey = {};
    pl.vals = vals;
    pl.have = function(k) {
        return (k in vals && vals[k].val !== vals[k].default);
    };
    pl.get = function(k) {
        if (!(k in vals)) { return undefined; }
        return vals[k].val;
    };
    pl.set = function(k,v) {
        vals[k].val = vals[k].parse(v);
        url.params[vals[k].urlKey] = vals[k].toString(vals[k].val);
    };
    pl.setState = function(state) {
        Object.keys(state).forEach(function(key) {
            if (!(key in pl.commandsByUrlKey)) { return; }
            var cmd = pl.commandsByUrlKey[key];
            if (cmd.permalink.setState) {
                cmd.permalink.setState(cmd.permalink.parse(state[key]));
                pl.set(cmd.permalink.key, state[key]);
            }
        });
        pl.updateWindowURL();
    };
    commands.forEach(function(cmd) {
        if (cmd.permalink) {
            vals[cmd.permalink.key] = cmd.permalink;
            vals[cmd.permalink.key].val = cmd.permalink.default;
            if (cmd.permalink.urlKey) {
                pl.commandsByUrlKey[cmd.permalink.urlKey] = cmd;
            }
            if (cmd.permalink.urlKey in url.params) {
                vals[cmd.permalink.key].val = cmd.permalink.parse(url.params[cmd.permalink.urlKey]);
            }
            if (cmd.permalink.setState) {
                if (pl.have(cmd.permalink.key)) {
                    cmd.permalink.setState(pl.get(cmd.permalink.key));
                }
            }
        }
    });
    return pl;
};
