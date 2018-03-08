"use strict";
const async = require("async");
const {
    Builder, By, Key, until
} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

const app_config = require("./app_config.js");

const target_file = app_config.link_dump_hit;

const supported_dl_sites = ["www.mediafire.com/file/", "yadi.sk/d/", "drive.google.com/file/d/", "docs.google.com/uc"];

var inverted_indexOf = function (a, s) {
    for (var i = 0; i < a.length; i++) {
        if (s.includes(a[i])) { return i; }
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

var p_dump_append = function (f_path, obj) {
    return new Promise((t, f) => {
        fs.appendFile(f_path, obj, "utf-8", (err) => {
            if (err) { f(err); }
            else { t(obj); }
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
        await driver.wait(until.elementLocated(By.className(`action-buttons__button_download`)), http_timeout, "Timeout: Waiting for Yandisk download page");
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
        await driver.wait(until.elementLocated(By.id(`download_visible_wrapper`)), http_timeout, "Timeout: Waiting for MediaFire download page");
        await driver.sleep(app_config.expected_loading_time);

        var dl_div = null;
        var dl_auth = await driver.findElements(By.className(`download_link`));
        //console.log(dl_div);
        if (!(dl_div && dl_div.length > 0)) {
            dl_auth = await driver.findElements(By.id("authorize_dl_btn"));
            if (!(dl_auth && dl_auth.length > 0)) {
                console.log("No download button or authourize page is found. Skipping.");
            } else {
                console.log("Found authourize page (Captha). Dumping link to seperate files.");
                await p_dump_append(app_config.link_dump_pending, target_link + "\r\n");
            }
        } else {
            //Button avaliable.
            var dl_a = await dl_div[0].findElements(By.tagName(`a`));
            var dl_s = await dl_a[0].getAttribute(`href`);
            console.log(`Found actual link: ${dl_s}`);
            driver.executeScript(`window.open('${dl_s}','_blank');`); //await driver.get(dl_s);
            //await dl_div.click();
            await driver.sleep(app_config.expected_loading_time);
            //driver.quit();
        }
    } catch (e) {
        console.log(e);
        driver.quit();
    }
};

var find_in_google_drive = async function (driver, http_timeout, target_link) {
    console.log(`find_in_google_drive(${target_link})`);
    var drive_to_docs = function (s) {
        var a = s.split("/");
        return `https://docs.google.com/uc?id=` + (a.length > 2 ? a[a.length - 2] : "undefined") + `&export=download`;
    };
    return await find_in_google_docs(driver, http_timeout, drive_to_docs(target_link));
};

var find_in_google_docs = async function (driver, http_timeout, target_link) {

    //uc-download-link
    console.log(`find_in_google_docs(${target_link})`);

    try {
        await driver.get(target_link);
        //Note: Title could be in your local language
        //await driver.wait(until.titleContains(`Google`), http_timeout, "Timeout: Waiting for Google download page"); 
        await driver.sleep(app_config.expected_loading_time);
        var dl_div = await driver.findElements(By.id(`uc-download-link`));
        var dl_title = await driver.getTitle();
        if (!(dl_div && dl_div.length > 0)) {
            console.log("Seems it has been started. Dumping File name to seperate files."); 
            //Actually it has no title. Kept for potential use.
            await p_dump_append(app_config.link_dump_pending, dl_title + "\r\n");
        } else {
            await dl_div[0].click();
        }
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
        case 2: return await find_in_google_drive(driver_map[2], http_timeout_map[2], target_link); break;
        case 3: return await find_in_google_docs(driver_map[3], http_timeout_map[3], target_link); break;
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

    //Driver.setDownloadPath(path) is possible. Rewrite if this option fails.
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