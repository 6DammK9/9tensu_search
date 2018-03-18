"use strict";
const fs = require('fs');
const mkdirp = require("mkdirp");

const app_config = require("./app_modules/app_config.js");
const tensu_search = require("./app_modules/9tensu_search.js");
const tensu_explore = require("./app_modules/9tensu_explore.js");
const rename_dir = require("./app_modules/rename_dir.js");
const search_codec = require("./app_modules/search_codec.js");
const music_tag = require("./app_modules/music_tag");
const doujinstyle_scan = require("./app_modules/doujinstyle_scan.js");
const dl_bot = require("./app_modules/dl_bot.js");
const slack_bot = require("./app_modules/slack_bot.js");

var p_dump = async function (f_path, obj) {
    return new Promise((t, f) => {
        fs.writeFile(f_path, JSON.stringify(obj, null, 4), (err) => {
            if (err) { f(err); }
            else { t(obj); }
        });
    });
};

var export_arr_to_plain_text = async function (f_path, arr) {
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

var p_mkdirp = function (path) {
    return new Promise((t, f) => {
        mkdirp(path, (err) => {
            if (err) { console.log(err); }
            t();
        });
    });
};

var task_start = new Date();

var duration_str = function (d) {

    var timestr_padzero = function (n) {
        if (n < 0) { return "XX"; }
        else {
            return n < 1 ? "00" : n < 10 ? "0" + n : n;
        }
    };

    //console.log(d);
    if (isNaN(d) || d <= 0) { return "00:00:00"; }

    //Date.getTime to hms
    var s = d / 1000;
    var m = s / 60;
    var h = m / 60;
    return timestr_padzero(Math.floor(h)) + ":" + timestr_padzero(Math.floor(m % 60)) + ":" + timestr_padzero(Math.round(s % 60)) + "";
};

var after_dl = async function () {
    var album_map = null;
    if (process.argv.includes("--search")) {
        album_map = await tensu_search.init();
        album_map = await p_dump(app_config.search_result_dump, album_map);
        album_map = await search_codec.init(album_map);
        album_map = await p_dump(app_config.search_result_dump, album_map);
    }
    if (process.argv.includes("--inherit")) {
        album_map = await p_import_from_file(app_config.explore_result_dump);
        album_map = await search_codec.init(album_map);
        album_map = await p_dump(app_config.explore_result_dump, album_map);
    }
    if (album_map) await rename_dir.init(album_map);
};

var before_dl = async function () {
    var links_map = null;
    if (process.argv.includes("--9tensu")) {
        links_map = await tensu_explore.init();
        await Promise.all([
            export_arr_to_plain_text(app_config.link_dump_wait_hit, links_map ? links_map.dl_links_hit.sort() : []),
            export_arr_to_plain_text(app_config.link_dump_wait_miss, links_map ? links_map.dl_links_miss.sort() : [])
        ]);
    }
    //await export_arr_to_plain_text(app_config.link_dump_wait, dl_links);
    if (process.argv.includes("--doujinstyle")) {
        links_map = await doujinstyle_scan.init();
        await Promise.all([
            export_arr_to_plain_text(app_config.link_dump_hit, links_map ? links_map.hit.sort() : []),
            export_arr_to_plain_text(app_config.link_dump_miss, links_map ? links_map.miss.sort() : [])
        ]);
    }
};

var time_to_dl = async function () {
    console.log(`Please manually terminate this window to stop the bots. I don't know all the exact file names of the links.`);
    return await dl_bot.init();
};

var print_help = function () {
    console.log(`Avaliable command: [node] [./app.js] [-scan [--9tensu] [--doujinstyle]] [-download] [-rename [--search] [--inherit]]`);
    console.log(`Note: [-download] won't return!`);
};

var init = async function () {
    try {
        console.log(`Process start with PID ${process.pid}`);
        await p_mkdirp(app_config.target_dir);
        await p_mkdirp(`./dump/${app_config.target_event}`);

        if (process.argv.includes("-help")) print_help();
        if (process.argv.includes("-scan")) await before_dl();
        if (process.argv.includes("-download")) await time_to_dl();
        if (process.argv.includes("-rename")) await after_dl();
        //await search_codec.test();
    } catch (e) {
        return e;
    }
};

init().then((err) => {
    if (err) console.log(err);
    var task_done = new Date();
    if (app_config.SLACK_WEB_HOOK) {
        slack_bot.init(app_config.SLACK_WEB_HOOK, {
            task_start: task_start,
            task_done: task_done,
            task_span: duration_str(task_done.getTime() - task_start.getTime()),
            err: err
        });
    }
    console.log(`Process end.`);
}).catch(console.log);