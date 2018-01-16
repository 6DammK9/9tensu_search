const fs = require("fs");
const path = require("path");
const async = require("async");

const app_config = require("./app_config.js");

var get_year = function (str) {
    return new Date(str).getFullYear();
};

var desired_folder_name = function (album_info) {
    var s = "";
    var a = app_config.target_event ? app_config.target_event : album_info.date ? get_year(album_info.date) : false;
    var b = album_info.producer;
    var c = album_info.title;
    var d = album_info.codec ? album_info.codec : app_config.default_codec_str ? app_config.default_codec_str : false;

    s += a ? `(${a}) ` : "";
    s += b ? `[${b}] ` : "";
    s += c ? `${c} ` : "";
    s += d ? `(${d})` : "";

    return s;
};

var get_directories = function (p) {
    return fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());
};

var init = function (album_map) {
    return new Promise((t, f) => {
        var folder_arr = get_directories(app_config.target_dir);
        var album_info = false;
        async.eachSeries(folder_arr, (folder_name, cb_in) => {
            album_info = album_map[folder_name];
            if (album_info) {
                fs.rename(path.join(app_config.target_dir, folder_name), path.join(app_config.target_dir, desired_folder_name(album_info)), (err) => {
                    if (err) { console.log(err.toString()); }
                    cb_in();
                });
            } else {
                cb_in();
            }
        }, (err) => {
            if (err) { f(err); }
            else { t(); }
        });
    });
};

var exports = module.exports = {
    init: init
};