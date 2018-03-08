const async = require("async");
const {
        Builder, By, Key, until
    } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

const app_config = require("./app_config.js");
const get_directories = require("./get_directories.js");
const path_str = require("./path_str.js");

var make_search_str = function (n) {
    return n.replace(/\+/g, "%2B").replace(/[-.*+?^${}()|[\]\\\&]/g, ' ').replace(/\s/g, "+");
}

var p_dump_writejson = function (f_path, obj) {
    return new Promise((t, f) => {
        fs.writeFile(f_path, JSON.stringify(obj, null, 4), "utf-8", (err) => {
            if (err) { f(err); }
            else { t(obj); }
        });
    });
};

let get_page_count = async function (driver) {
    var http_timeout = 0;

    var link = `http://www.9tensu.com/search/label/${app_config.target_event}`;

    await driver.get(link);
    http_timeout += app_config.http_timeout_extend;
    await driver.wait(until.titleContains(`9Tensu: ${app_config.target_event}`), http_timeout, "Timeout: Waiting for label page");
    await driver.sleep(app_config.expected_loading_time);
    var bottom_div = await driver.findElement(By.className(`archive-page-pagination-bottom`));
    var all_a = await bottom_div.findElements(By.tagName(`a`));
    var page_count = 0;

    let get_txt = async function (a) {
        var a_txt = await a.getText();
        //console.log(a_txt);
        var n = parseInt(a_txt);
        page_count = ((!isNaN(n)) && (page_count > n)) ? page_count : n;
    };

    //async.eachSeries
    await all_a.reduce((p, a) => {
        return p.then(() => { return get_txt(a); });
    }, Promise.resolve());

    return page_count;
};

let get_all_album_index = async function (driver, page_count) {
    var album_map = {};
    var http_timeout = page_count * app_config.http_timeout_extend;
    //console.log(`get_all_album_index(${page_count})`);

    var a_for = function (c) {
        var a = [];
        for (var i = 1; i <= c; i++) {
            a.push(i);
        }
        return a;
    };

    let get_page_content = async function (page_num) {
        var get_item_content = async function (div_item) {
            //console.log(`get_item_content`);
            var h3_title = await div_item.findElement(By.className(`item-title`));
            var str_title = await h3_title.getText();
            str_title = str_title.trim();
            var a_title = await h3_title.findElement(By.tagName(`a`));
            var herf_title = await a_title.getAttribute(`href`);
            if (!album_map[str_title]) {
                album_map[str_title] = {};
            }
            album_map[str_title].link = herf_title;
        };

        //console.log(`get_page_content(${page_num})`);
        var link = `http://www.9tensu.com/search/label/${app_config.target_event}#archive-page-${page_num}`;
        //This is currently a bug in chrome driver (as in Chrome 64). However switching to a whole new page helps.
        //Ref: https://github.com/giggio/node-chromedriver/issues/141
        //Ref: https://github.com/webdriverio/webdriverio/issues/2579
        await driver.get(`about:blank`);
        await driver.sleep(1000);
        await driver.get(link);
        await driver.wait(until.titleContains(`9Tensu: ${app_config.target_event}`), http_timeout, "Timeout: Waiting for label page");
        await driver.sleep(app_config.expected_loading_time);
        var div_content = await driver.findElement(By.id(`widget-content-HTML4`));
        var div_items = await div_content.findElements(By.className(`item-content`));
        console.log(`${div_items.length} items found in page ${page_num}`)

        if (div_items) {
            await div_items.reduce((p, div_item) => {
                return p.then(() => { return get_item_content(div_item); });
            }, Promise.resolve());
        } else {
            console.log(`Error: no items found!`);
        }
    };

    await a_for(page_count).reduce((p, a) => {
        return p.then(() => { return get_page_content(a); });
    }, Promise.resolve());
    return album_map;
};

//No throw. Keep progress.
var init = async function () {

    var driver = new Builder()
        .forBrowser(app_config.search_browser)
        .build();

    try {
        var page_count = await get_page_count(driver);
        console.log(`page_count = ${page_count}`);

        //TODO: Get all related album links from page count.
        //async.eachSeries
        var album_map = await get_all_album_index(driver, page_count);
        await p_dump_writejson(app_config.explore_result_dump, album_map);

        //TODO: Get all download links and album contents from each albums.
        console.log(`driver.quit()`);
        driver.quit();
    } catch (e) {
        console.log(e);
        driver.quit();
    }

};


var exports = module.exports = {
    init: init
};