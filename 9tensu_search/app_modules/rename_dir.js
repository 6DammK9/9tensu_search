const fs = require("fs-extra");
const path = require("path");
const async = require("async");

const app_config = require("./app_config.js");
const get_directories = require("./get_directories.js");

var get_year = function (str) {
    return new Date(str).getFullYear();
};

var escape_path = function (bad_str) {
    //Escape incompatiable character from half width to full width. Should be in utf-8.
    var m = [
        [/\\/g, "＼"],
        [/\//g, "／"],
        [/\:/g, "："],
        [/\*/g, "＊"],
        [/\?/g, "？"],
        [/\"/g, "＂"],
        [/\</g, "＜"],
        [/\>/g, "＞"],
        [/\|/g, "｜"]
    ];
    try {
        m.forEach((a) => {
            bad_str = bad_str.replace(a[0], a[1]);
        });
        return bad_str;
    } catch (e) {
        console.log(e); //Should not happen
        return bad_str;
    }
};

var desired_names = function (album_info) {
    var s_f = "";
    var s_c = "";
    var a = app_config.target_event ? app_config.target_event : album_info.date ? get_year(album_info.date) : false;
    var b = album_info.producer;
    var c = album_info.title;
    var d = album_info.codec ? album_info.codec : app_config.default_codec_str ? app_config.default_codec_str : false;

    s_f += a ? `(${a}) ` : "";
    s_f += b ? `[${b}] ` : "";
    s_f += c ? `${c} ` : "";
    s_f += d ? `(${d})` : "";

    s_c += b ? `[${b}] ` : "";
    s_c += c ? `${c}` : "";

    return { folder: escape_path(s_f), cover: escape_path(s_c) };
};

var rename_cover = function (folder_name, album_info) {
    return new Promise((t, f) => {
        fs.readdir(path.join(app_config.target_dir, folder_name), (err, files) => {
            if (err) { f(err); }
            else {
                var found_target = null;
                files.forEach((c) => {
                    found_target = found_target ? found_target : path.parse(c).name.toLowerCase().indexOf("cover") >= 0 ? c : found_target;
                });
                //console.log([found_target, path.join(app_config.target_dir, folder_name, found_target), path.join(app_config.target_dir, desired_names(album_info).cover) + "." + path.parse(found_target).ext]);
                if (found_target) {
                    //Added in node v8.5 but I'm using v6.9
                    fs.copy(path.join(app_config.target_dir, folder_name, found_target), path.join(app_config.target_dir, desired_names(album_info).cover) + path.parse(found_target).ext, (err) => {
                        if (err) { f(err); }
                        else { t(); }
                    });
                } else { t(); } //Skip if no target found
            }
        });
    });
};

var rename_folder = function (folder_name, album_info) {
    return new Promise((t, f) => {
        fs.rename(path.join(app_config.target_dir, folder_name), path.join(app_config.target_dir, desired_names(album_info).folder), (err) => {
            if (err) { f(err); }
            else { t(); }
        });
    });
};

var init = function (album_map) {
    return new Promise((t, f) => {
        var folder_arr = get_directories.init(app_config.target_dir);
        var album_info = false;
        async.eachSeries(folder_arr, (folder_name, cb_in) => {
            album_info = album_map[folder_name];
            if (album_info) {
                rename_cover(folder_name, album_info).then(() => {
                    return rename_folder(folder_name, album_info);
                }).then(cb_in).catch((err) => {
                    console.log(err.toString());
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

