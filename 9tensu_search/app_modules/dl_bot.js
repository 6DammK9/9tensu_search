"use strict";
const async = require("async");
const {
    Builder, By, Key, until
} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const url = require('url'); //Using Legacy URL API for NodeJS 6 LTS

const app_config = require("./app_config.js");

const target_file = app_config.link_dump_hit;

const supported_dl_sites = ["www.mediafire.com/file", "yadi.sk/d/zzzzz"];

var inverted_indexOf = function (a, s) {
    for (var i = 0; i < a.length; i++) {
        if (s.indexOf(a[i]) >= 0) { return i; }
    }
    return -1;
};

var get_links_from_file = function (f_path) {
    return new Promise((t, f) => {
        fs.readFile(f_path, "utf-8", (err, data) => {
            if (err) { f(err); }
            else { t(data.split("\n").map(s => s.trim()).filter(s => inverted_indexOf(supported_dl_sites, s) >= 0)); }
        });
    });
};


//var temp = async function () {
//    return (await get_links_from_file("C:/node_workspace/9tensu_search/9tensu_search/dump/hit.txt"));
//};

//temp().then(console.log);

var find_in_yadisk = async function (driver, http_timeout, target_link) {
    //action-buttons__button_download
    console.log(`find_in_yadisk(${target_link})`);

    try {
        await driver.get(target_link);
        await driver.wait(until.elementLocated(By.className(`action-buttons__button_download`)), http_timeout, "Timeout: Waiting for first page of the thread");
        await driver.sleep(app_config.expected_loading_time);
        var dl_div = await driver.findElements(By.className(`action-buttons__button_download`));
        await dl_div[0].click();
        await driver.sleep(app_config.expected_loading_time);
        //driver.quit();
    } catch (e) {
        console.log(e);
        driver.quit();
    }
}

var find_in_mediafire = async function (driver, http_timeout, target_link) {

    console.log(`find_in_mediafire(${target_link})`);

    try {
        await driver.get(target_link);
        await driver.wait(until.elementLocated(By.className(`download_link`)), http_timeout, "Timeout: Waiting for first page of the thread");
        await driver.sleep(app_config.expected_loading_time);
        var dl_div = await driver.findElement(By.className(`download_link`));
        var dl_a = await dl_div.findElements(By.tagName(`a`));
        var dl_s = await dl_a[0].getAttribute(`href`);
        console.log(`Found actual link: ${dl_s}`);
        driver.executeScript(`window.open('${dl_s}','_blank');`); //await driver.get(dl_s);
        //await dl_div.click();
        await driver.sleep(app_config.expected_loading_time);
        //driver.quit();
    } catch (e) {
        console.log(e);
        driver.quit();
    }
};


var access_single_link = async function (driver_map, http_timeout_map, target_link) {
    switch (inverted_indexOf(supported_dl_sites, target_link)) {
        case 0: return await find_in_mediafire(driver_map[0], http_timeout_map[0], target_link); break;
        case 1: return await find_in_yadisk(driver_map[1], http_timeout_map[1], target_link); break;
        default: return "Link is not supported!";
    }
};

var get_download_status = async function (driver) {
    await driver.get("chrome://downloads/");
};

//No throw. Keep progress.
var init = async function () {
    var links_arr = [];

    links_arr = await get_links_from_file(target_file);

    //console.log(links_arr);
    var driver_map = [];
    var http_timeout_map = [];

    supported_dl_sites.forEach((sites) => {
        driver_map.push(new Builder()
            .forBrowser(app_config.search_browser)
            .setChromeOptions(new chrome.Options()
                .setUserPreferences({ 'download.default_directory': app_config.target_dir }))
            .build());
        http_timeout_map.push(app_config.http_timeout_extend * links_arr.length * 1.5);
    });

    try {

        //async.eachSeries
        links_arr.reduce((p, target_link) => {
            return p.then(() => { return access_single_link(driver_map, http_timeout_map, target_link); });
        }, Promise.resolve()).then(() => {
            return Promise.all(driver_map.map(driver => get_download_status(driver)));
        });

    } catch (e) {
        console.log(e);
    }

};

var exports = module.exports = {
    init: init
};