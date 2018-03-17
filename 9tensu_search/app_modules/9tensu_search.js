"use strict";
const { Builder, By, Key, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

const app_config = require("./app_config.js");
const get_directories = require("./get_directories.js");
const path_str = require("./path_str.js");

var make_search_str = function (n) {
    return n.replace(/\+/g, "%2B").replace(/[-.*+?^${}()|[\]\\\&]/g, ' ').replace(/\s/g, "+");
}

//No throw. Keep progress.
var init = async function () {
    //return new Promise((a, b) => {
    var driver = new Builder()
        .forBrowser(app_config.search_browser)
        .build();
    var album_map = {};
    var http_timeout = 0;

    var fill_album_map = async function (dir) {
        var result = {
            title: null,
            producer: null,
            date: null,
            tracks: [],
            codec: null
        };
        var error = null;
        var album_name = path_str.unescape_path(dir);
        var link = `http://www.9tensu.com/search?q=${make_search_str(album_name)}`;

        await driver.get(link)
        http_timeout += app_config.http_timeout_extend;
        await driver.wait(until.titleContains(`9Tensu: Search results`), http_timeout, "Timeout: Waiting for search results");
        await driver.sleep(app_config.expected_loading_time);
        var div_wc = await driver.findElement(By.id(`widget-content-HTML4`));
        var txt_wc = await div_wc.getText();

        if (txt_wc.includes("Your keyword does not match any of entries.")) {
            console.log({ error: "Search fail!", title: album_name });
        } else {
            var a_arr = await driver.findElements(By.partialLinkText(album_name)); //await driver.findElements(By.css(`a`));
            var txt_a = null;
            //TODO: Need to try both escaped and unescaped album_name

            if (a_arr && a_arr.length > 0) {
                txt_a = a_arr[0];
            } else {
                //Special catch 
                //console.log(e);
                album_name = path_str.escape_path(album_name, true);
                console.log(`retrying escaped album_name ${album_name}`);
                a_arr = await driver.findElements(By.partialLinkText(album_name));
                if (a_arr && a_arr.length > 0) {
                    txt_a = a_arr[0];
                }
            }

            if (txt_a) {
                //console.log("Target found!"); 
                //w.getText().then(console.log);
                var herf_a = await txt_a.getAttribute(`href`);

                if (herf_a) {
                    await driver.get(herf_a);
                    http_timeout += app_config.http_timeout_extend;
                    await driver.wait(until.titleContains(album_name), http_timeout, "Timeout: Waiting for target album page");
                    await driver.sleep(app_config.expected_loading_time);
                    var li_arr = await driver.findElements(By.css(`li`));

                    var fill_album_entry = async function (w) {
                        var s = await w.getText();
                        if ((s.trim().length > 0) && (!app_config.ignore_items.includes(s))) {
                            if (s.includes("Producer : ")) {
                                result.producer = s.replace("Producer : ", "").trim();
                            } else if (s.includes("Title : ")) {
                                result.title = s.replace("Title : ", "").trim();
                            } else if (s.includes("Release date : ")) {
                                result.date = s.replace("Release date : ", "").trim();
                            } else {
                                result.tracks.push(s);
                            }
                        }
                    };

                    await li_arr.reduce((p, w) => {
                        return p.then(() => { return fill_album_entry(w); });
                    }, Promise.resolve());

                    //console.log(JSON.stringify(result, null, 4));
                    album_map[result.title] = result;
                } else {
                    console.log({ error: "No a.herf found!", title: album_name });
                }
            } else {
                console.log({ error: "No a found!", title: album_name });
            }
        }
    };

    await get_directories.init(app_config.target_dir).reduce((p, dir) => {
        return p.then(() => { return fill_album_map(dir); });
    }, Promise.resolve());

    driver.quit();
    return album_map;
}

var exports = module.exports = {
    init: init
};