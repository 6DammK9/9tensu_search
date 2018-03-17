"use strict";

const fs = require("fs-extra");
const path = require("path");
const async = require("async");
const rreaddir = require("recursive-readdir");

const app_config = require("./app_config.js");
const get_directories = require("./get_directories.js");
const path_str = require("./path_str.js");

const image_ext = ["jpg", "jpeg", "png", "gif"];

var get_year = function (str) {
    return new Date(str).getFullYear();
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

    return { folder: path_str.escape_path(s_f, false), cover: path_str.escape_path(s_c, false) };
};

var isCoverFile = function (c) {
    return ((path.parse(c).name.toLowerCase().includes("cover")) && (image_ext.includes(path.parse(c).ext.replace(".", "").toLowerCase())));
};

var rename_cover = function (folder_name, album_info) {
    return new Promise((t, f) => {
        rreaddir(path.join(app_config.target_dir, folder_name), (err, files) => {
            if (err) { f(err); }
            else {
                var found_target = null;
                files.forEach((c) => {
                    found_target = found_target ? found_target : isCoverFile(c) ? c : found_target;
                });
                //console.log([found_target, path.join(app_config.target_dir, folder_name, found_target), path.join(app_config.target_dir, desired_names(album_info).cover) + "." + path.parse(found_target).ext]);
                if (found_target) {
                    //Added in node v8.5 but I'm using v6.9
                    fs.copy(found_target, path.join(app_config.target_dir, desired_names(album_info).cover) + path.parse(found_target).ext, (err) => {
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


var init = async function (album_map) {
    //return new Promise((t, f) => {
    var folder_arr = get_directories.init(app_config.target_dir);
    var album_info = null;
    var album_key = null;

    var p_rename = async function (folder_name) {
        album_key = path_str.k_by_partial_k(album_map, path_str.unescape_path(folder_name));
        if (!album_key) {
            console.log(`Warning: Key ${path_str.unescape_path(folder_name)} is not in the map.`);
            console.log(`Retrying Key ${path_str.escape_path(folder_name)}...`);
            album_key = path_str.k_by_partial_k(album_map, path_str.escape_path(folder_name, true));
        }
        if (!album_key) {
            console.log(`Warning: Key ${path_str.unescape_path(folder_name)} is not in the map.`);
        } else if (!album_map[album_key]) {
            console.log(`Warning: Value ${album_key} is not in the map.`);
        } else {
            album_info = album_map[album_key];
            try {
                await rename_cover(folder_name, album_info);
                await rename_folder(folder_name, album_info);
            } catch(err) {
                console.log(err.toString());
            }
        }
    }

    await folder_arr.reduce((p, folder_name) => {
        return p.then(() => { return p_rename(folder_name); });
    }, Promise.resolve());
};

var exports = module.exports = {
    init: init
};

