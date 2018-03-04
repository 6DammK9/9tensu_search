const fs = require('fs');

const app_config = require("./app_modules/app_config.js");
const search = require("./app_modules/9tensu_search.js");
const rename_dir = require("./app_modules/rename_dir.js");
const search_codec = require("./app_modules/search_codec.js");
const music_tag = require("./app_modules/music_tag");
const doujinstyle_scan = require("./app_modules/doujinstyle_scan.js");
const dl_bot = require("./app_modules/dl_bot.js");

var p_dump = function (f_path, obj) {
    return new Promise((t, f) => {
        fs.writeFile(f_path, JSON.stringify(obj, null, 4), (err) => {
            if (err) { f(err); }
            else { t(obj); }
        });
    });
};

var export_arr_to_plain_text = function (f_path, arr) {
    return new Promise((t, f) => {
        fs.writeFile(f_path, arr.reduce((a, c) => a + c + "\r\n", ""), (err) => {
            if (err) { f(err); }
            else { t(arr); }
        });
    });
};

var p_import_from_file = function (f_path) {
    return new Promise((t, f) => {
        fs.readFile(f_path, 'utf8', (err, str) => {
            if (err) { f(err); }
            else {
                try {
                    t(JSON.parse(str));
                } catch (e) {
                    f(e);
                }
            }
        });
    });
};

var after_dl = function () {
    search.init().then((album_map) => {
        //p_import_from_file(app_config.search_result_dump).then((album_map) => {
        return p_dump(app_config.search_result_dump, album_map);
    }).then((album_map) => {
        return search_codec.init(album_map);
    }).then((album_map) => {
        return p_dump(app_config.search_result_dump, album_map);
    }).then((album_map) => {
        return rename_dir.init(album_map);
    }).then(() => {
        console.log(`Process end.`);
    }).catch(console.log);
};

var before_dl = function () {
    doujinstyle_scan.init().then((links_map) => {
        return Promise.all([
            export_arr_to_plain_text(app_config.link_dump_hit, links_map ? links_map.hit.sort() : []),
            export_arr_to_plain_text(app_config.link_dump_miss, links_map ? links_map.miss.sort() : [])
        ]);
    }).then(() => {
        console.log(`Process end.`);
    }).catch(console.log);
};

var time_to_dl = function () {
    dl_bot.init().then(() => {
        console.log(`Please manually terminate this window to stop the bots. I don't know all the exact file names of the links.`);
    }).catch(console.log);
};

console.log(`Process start with PID ${process.pid}`);
//before_dl();
time_to_dl();
//after_dl();
//search_codec.test();