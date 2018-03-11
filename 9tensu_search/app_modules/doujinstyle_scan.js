"use strict";
const async = require("async");
const {
    Builder, By, Key, until
} = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');
const url = require('url'); //Using Legacy URL API for NodeJS 6 LTS

const app_config = require("./app_config.js");

var get_page_count = function (arr_w) {
    return new Promise((a, b) => {
        var found_pages = 1;
        async.eachSeries(arr_w, (w, cb_w) => {
            w.getText().then((s) => {
                found_pages = parseInt(s) > found_pages ? parseInt(s) : found_pages;
                cb_w();
            }).catch(cb_w);
        }, (err) => {
            if (err) { b(err); }
            else { a(found_pages); }
        });
    });
};

var match_pattern = function (s, a_p) {
    try {
        return (s && a_p) ? a_p.includes(url.parse(s).host) : false;
    } catch (e) {
        console.log(e);
        return false;
    }
};

var get_href_from_a = function (arr_w) {
    return new Promise((a, b) => {
        var result = {
            hit: [],
            miss: [],
        };
        async.eachSeries(arr_w, (w, cb_w) => {
            w.getAttribute(`href`).then((s) => {
                if (match_pattern(s, app_config.DL_SITES)) {
                    result.hit.push(s);
                } else {
                    result.miss.push(s);
                }
                return cb_w();
            }).catch(cb_w);
        }, (err) => {
            if (err) { b(err); }
            else { a(result); }
        });
    });
};

var generate_links_with_page_number = function (link, pages) {
    var a = [];
    if (!pages) pages = 1;
    for (var i = 1; i <= pages; i++) {
        a.push(link + (i > 1 ? `&p=${i}` : ``));
    }
    return a;
};

var search_links_for_each_post = function (arr_w) {
    return new Promise((a, b) => {
        var result = {
            hit: [],
            miss: []
        };
        async.eachSeries(arr_w, (w, cb_w) => {
            w.findElement(By.className(`postbody`)).then((w) => {
                return w.findElement(By.className(`post-entry`));
            }).then((w) => {
                return w.findElement(By.className(`entry-content`));
            }).then((w) => {
                return w.findElements(By.css(`a`));
            }).then((arr_w) => {
                return get_href_from_a(arr_w);
            }).then((sub_result) => {
                result.hit = result.hit.concat(sub_result.hit);
                result.miss = result.miss.concat(sub_result.miss);
                cb_w();
            }).catch(cb_w);
        }, (err) => {
            if (err) { b(err); }
            else { a(result); }
        });
    });
};

var search_link_for_all_pages = function (driver, target_link, http_timeout, page_count) {
    return new Promise((a, b) => {
        var a_url = generate_links_with_page_number(target_link, page_count);
        var result = {
            hit: [],
            miss: []
        };
        async.eachSeries(a_url, (c_url, cb_in) => {
            var f = c_url === target_link ? driver.sleep(0) : driver.get(c_url); //Prevent wating time
            var cur_page = a_url.indexOf(url) + 1;
            f.then(() => {
                http_timeout += app_config.http_timeout_extend;
                return driver.wait(until.titleContains(`DoujinStyle.com`), http_timeout, `Timeout: Waiting for page ${cur_page} of the thread`);
            }).then(() => {
                return driver.sleep(app_config.expected_loading_time);
            }).then(() => {
                return driver.findElement(By.id(`forum16`));
            }).then((w) => {
                return w.findElements(By.className(`post`));
            }).then((arr_w) => {
                return search_links_for_each_post(arr_w);
            }).then((sub_result) => {
                result.hit = result.hit.concat(sub_result.hit);
                result.miss = result.miss.concat(sub_result.miss);
                cb_in();
            }).catch(cb_in);
        }, (err) => {
            if (err) { b(err); }
            else { a(result); }
        });
    });
};

//No throw. Keep progress.
var init = function () {
    return new Promise((a, b) => {

        var driver = new Builder()
            .forBrowser(app_config.search_browser)
            .build();
        var http_timeout = 0;
        var target_link = app_config.doujinstyle_target;

        driver.get(target_link).then(() => {
            http_timeout += app_config.http_timeout_extend;
            return driver.wait(until.titleContains(`DoujinStyle.com`), http_timeout, "Timeout: Waiting for first page of the thread");
        }).then(() => {
            return driver.sleep(app_config.expected_loading_time);
        }).then(() => {
            return driver.findElement(By.id(`brd-pagepost-top`));
        }).then((w) => {
            return w.findElement(By.className(`paging`));
        }).then((w) => {
            return w.findElements(By.css(`*`));
        }).then((arr_w) => {
            return get_page_count(arr_w);
        }).then((page_count) => {
            return search_link_for_all_pages(driver, target_link, http_timeout, page_count);
        }).then((result) => {
            driver.quit();
            a(result);
        }).catch((err) => {
            driver.quit();
            b(err);
        });
    });
}

var exports = module.exports = {
    init: init
};