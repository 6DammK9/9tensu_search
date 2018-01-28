//Note: mm2 is the winner. I need xing tag parser, which gives out the codec profile (although not accurate through different LAME versions)
//Note: will not include other libraries in packet.json. Unless I want to edit tags by script. Foobar2000 is still confortable for me.

//const id3 = require("id3js");
//const nodeID3v2 = require('node-id3v2.4');
//const id3r = require("node-id3-reader");
//const fs = require('fs');
//const mm = require('musicmetadata');
var mm2 = require('music-metadata');

var try_id3 = function (target, cb) {
    id3({ file: target, type: id3.OPEN_LOCAL }, cb);
};

var try_id3v2 = function (target, cb) {
    try {
        return cb(null, nodeID3v2.readTag(target));
    } catch (e) {
        return cb(e, null);
    }
};

var try_id3r = function (target, cb) {
    id3r.parse(target, cb);
};

// create a new parser from a node ReadStream 
var try_mm = function (target, cb) {
    return mm(fs.createReadStream(target), cb);
};

var try_mm2 = function (target, cb) {
    return mm2.parseFile(target, { native: true });
    //.then(function (metadata) {
    //    console.log(util.inspect(metadata, { showHidden: false, depth: null }));
    //}).catch((e) => { return });
};

var exports = module.exports = {
    try_id3: try_id3,
    try_id3v2: try_id3v2,
    try_id3r: try_id3r,
    try_mm: try_mm,
    try_mm2: try_mm2
};