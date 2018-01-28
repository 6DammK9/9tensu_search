const async = require("async");
const {Builder, By, Key, until} = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

const app_config = require("./app_config.js");
const get_directories = require("./get_directories.js");
const path_str = require("./path_str.js");

var make_search_str = function (n) {
    return n.replace(/[.*+?^${}()|[\]\\]/g, ' ').replace(/\s/g, "+");
}

//No throw. Keep progress.
var init = function () {
    return new Promise((a, b) => {
        var driver = new Builder()
            .forBrowser(app_config.search_browser)
            .build();
        var album_map = {};
        var http_timeout = 0;

        async.eachSeries(get_directories.init(app_config.target_dir), (dir, cb_in) => {
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

            driver.get(link).then(() => {
                http_timeout += app_config.http_timeout_extend;
                return driver.wait(until.titleContains(`9Tensu: Search results`), http_timeout, "Timeout: Waiting for search results");
            }).then(() => {
                return driver.sleep(app_config.expected_loading_time);
            }).then(() => {
                return driver.findElement(By.id(`widget-content-HTML4`));
            }).then((w) => {
                return w.getText();
            }).then((s) => {
                if (s.indexOf("Your keyword does not match any of entries.") >= 0) {
                    error = {
                        error: "Search fail!",
                        title: album_name
                    };
                    console.log(error);
                    return cb_in();
                } else {
                    driver.findElements(By.tagName(`a`)).then((arr_w) => {
                        //TODO: Need to try both escaped and unescaped album_name
                        return driver.findElement(By.partialLinkText(album_name));
                    }).catch((e) => {
                        //Special catch 
                        //console.log(e);
                        album_name = path_str.escape_path(album_name, true);
                        console.log(`retrying escaped album_name ${album_name}`);
                        return driver.findElement(By.partialLinkText(album_name));
                    }).then((w) => {
                        //console.log("Target found!"); 
                        //w.getText().then(console.log);
                        return w.getAttribute(`href`);
                    }).then((s) => {
                        if (s) {
                            driver.get(s).then(() => {
                                http_timeout += app_config.http_timeout_extend;
                                return driver.wait(until.titleContains(album_name), http_timeout, "Timeout: Waiting for target album page");
                            }).then(() => {
                                return driver.sleep(app_config.expected_loading_time);
                            }).then(() => {
                                return driver.findElements(By.tagName(`li`));
                            }).then((web_elements) => {
                                web_elements.forEach((w) => {
                                    w.getText().then((s) => {
                                        if ((s.trim().length > 0) && (app_config.ignore_items.indexOf(s) < 0)) {
                                            if (s.indexOf("Producer : ") >= 0) {
                                                result.producer = s.replace("Producer : ", "").trim();
                                            } else if (s.indexOf("Title : ") >= 0) {
                                                result.title = s.replace("Title : ", "").trim();
                                            } else if (s.indexOf("Release date : ") >= 0) {
                                                result.date = s.replace("Release date : ", "").trim();
                                            } else {
                                                result.tracks.push(s);
                                            }
                                        }
                                    });
                                });
                            }).then(() => {
                                //console.log(JSON.stringify(result, null, 4));
                                album_map[result.title] = result;
                                //driver.quit();
                                cb_in();
                            });
                        } else {
                            error = {
                                error: "No link found!",
                                title: album_name
                            };
                            console.log(error);
                            //driver.quit();
                            cb_in();
                        }
                    }).catch((err) => {
                        console.log(err.toString());
                        cb_in();
                    });
                }
            });
        }, (err) => {
            driver.quit();
            if (err) { b(err); }
            else { a(album_map); }
        });
    });
}

var exports = module.exports = {
    init: init
};