const id3 = require("id3js");

var get_tag = function (target, cb) {
    id3({ file: target, type: id3.OPEN_LOCAL }, cb);
};

var exports = module.exports = {
    get_tag: get_tag
};