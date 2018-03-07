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


var get_page_count = async function (driver) {
    var http_timeout = 0;

    var link = `http://www.9tensu.com/search/label/${app_config.target_event}`;

    await driver.get(link);
    http_timeout += app_config.http_timeout_extend;
    await driver.wait(until.titleContains(`9Tensu: ${app_config.target_event}`), http_timeout, "Timeout: Waiting for label page");
    await driver.sleep(app_config.expected_loading_time);
    var bottom_div = await driver.findElement(By.className(`archive-page-pagination-bottom`));
    var all_a = await bottom_div.findElements(By.tagName(`a`));
    var page_count = 0;

    var get_txt = async function (a) {
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

//No throw. Keep progress.
var init = async function () {

    var driver = new Builder()
        .forBrowser(app_config.search_browser)
        .build();
 
    try {
        page_count = await get_page_count(driver);
        console.log(`page_count = ${page_count}`);

        //TODO: Get all related album links from page count.
        //TODO: Get all download links from each albums.
        driver.quit();
    } catch (e) {
        console.log(e);
        driver.quit();
    }

};


var exports = module.exports = {
    init: init
};