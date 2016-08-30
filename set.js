function set() {
    var h = {};
    return {
        add:      function(x) { h[x] = true; },
        delete:   function(x) { delete h[x]; },
        contains: function(x) { return x in h; },
        members:  function() { return Object.keys(h); },
        size:     function() { return Object.keys(h).length; }
    };
}

module.exports = set;
