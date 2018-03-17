"use strict";
const {
    Builder, By, Key, until
} = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');
const url = require('url'); //Using Legacy URL API for NodeJS 6 LTS

const app_config = require("./app_config.js");

var get_page_count = async function (arr_w) {
    var found_pages = 1;

    var update_page_count = async function (w) {
        var s = await w.getText();
        found_pages = parseInt(s) > found_pages ? parseInt(s) : found_pages;
    };

    await arr_w.reduce((p, w) => {
        return p.then(() => { return update_page_count(w); });
    }, Promise.resolve());

    return found_pages;
};

var match_pattern = function (s, a_p) {
    try {
        return (s && a_p) ? a_p.includes(url.parse(s).host) : false;
    } catch (e) {
        console.log(e);
        return false;
    }
};

var get_href_from_a = async function (arr_w) {
    var result = {
        hit: [],
        miss: [],
    };

    var fill_result = async function (w) {
        var s = await w.getAttribute(`href`);
        if (match_pattern(s, app_config.DL_SITES)) {
            result.hit.push(s);
        } else {
            result.miss.push(s);
        }
    };

    await arr_w.reduce((p, w) => {
        return p.then(() => { return fill_result(w); });
    }, Promise.resolve());

    return result;
};

var generate_links_with_page_number = function (link, pages) {
    var a = [];
    if (!pages) pages = 1;
    for (var i = 1; i <= pages; i++) {
        a.push(link + (i > 1 ? `&p=${i}` : ``));
    }
    return a;
};

var search_links_for_each_post = async function (arr_w) {
    var result = {
        hit: [],
        miss: []
    };

    var fill_result = async function (w) {
        var div_post_body = await w.findElement(By.className(`postbody`));
        var div_post_entry = await div_post_body.findElement(By.className(`post-entry`));
        var div_entry_content = await div_post_entry.findElement(By.className(`entry-content`));
        var arr_a = await div_entry_content.findElements(By.css(`a`));
        var sub_result = await get_href_from_a(arr_a);
        result.hit = result.hit.concat(sub_result.hit);
        result.miss = result.miss.concat(sub_result.miss);
    };

    await arr_w.reduce((p, w) => {
        return p.then(() => { return fill_result(w); });
    }, Promise.resolve());

    return result;
};

var search_link_for_all_pages = async function (driver, target_link, http_timeout, page_count) {
    var a_url = generate_links_with_page_number(target_link, page_count);
    var result = {
        hit: [],
        miss: []
    };

    var fill_result = async function (c_url) {
        var f = c_url === target_link ? driver.sleep(0) : driver.get(c_url); //Prevent wating time
        var cur_page = a_url.indexOf(url) + 1;
        await f;
        http_timeout += app_config.http_timeout_extend;
        await driver.wait(until.titleContains(`DoujinStyle.com`), http_timeout, `Timeout: Waiting for page ${cur_page} of the thread`);
        await driver.sleep(app_config.expected_loading_time);
        var div_f = await driver.findElement(By.id(`forum16`));
        var arr_post = await div_f.findElements(By.className(`post`));
        var sub_result = await search_links_for_each_post(arr_w);
        result.hit = result.hit.concat(sub_result.hit);
        result.miss = result.miss.concat(sub_result.miss);
    };

    await a_url.reduce((p, c_url) => {
        return p.then(() => { return fill_result(c_url); });
    }, Promise.resolve());

    return result;
};

//No throw. Keep progress.
var init = async function () {
    var driver = new Builder()
        .forBrowser(app_config.search_browser)
        .build();
    var http_timeout = 0;
    var target_link = app_config.doujinstyle_target;
    await driver.get(target_link)
    http_timeout += app_config.http_timeout_extend;
    await driver.wait(until.titleContains(`DoujinStyle.com`), http_timeout, "Timeout: Waiting for first page of the thread");
    await driver.sleep(app_config.expected_loading_time);
    var div_pagepost = await driver.findElement(By.id(`brd-pagepost-top`));
    var div_paging = await div_pagepost.findElement(By.className(`paging`));
    var w_pages = await div_paging.findElements(By.css(`*`));
    var page_count = await get_page_count(arr_w);
    var result = null;
    try {
        result = await search_link_for_all_pages(driver, target_link, http_timeout, page_count);
        driver.quit();
        return result;
    } catch (e) {
        console.log(e);
        driver.quit();
        return result;
    }
};

var exports = module.exports = {
    init: init
};