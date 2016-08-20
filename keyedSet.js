function keyedSet() {
    var h = {};
    var key = 0;
    function nextKey() {
        return sprintf("%8x",++key);
    }
    return {
        elements: function() { return Object.keys(h).map(function(k) { return h[k]; }) },
        forEach: function(f) {
            Object.keys(h).forEach(function(k) { f(h[k]); });
        },
        contains: function(e) {
            return e.key in h;
        },
        add: function(e) {
            e.key = nextKey();
            h[e.key] = e;
        },
        remove: function(e) {
            delete h[e.key];
        }
    };
}

module.exports = keyedSet;
