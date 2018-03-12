const {
        Builder, By, Key, until
    } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');
const url = require("url");
const chrome = require('selenium-webdriver/chrome');

const app_config = require("./app_config.js");
const get_directories = require("./get_directories.js");
const path_str = require("./path_str.js");
var ad_fly_skipper = require("./ad_fly_skipper.js");

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

var p_dump_readjson = function (f_path) {
    return new Promise((t, f) => {
        fs.readFile(f_path, "utf-8", (err, str) => {
            if (err) { f(err); }
            else {
                try { t(JSON.parse(str)); }
                catch (ej) { f(ej); }
            }
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
    var all_a = await bottom_div.findElements(By.css(`a`));
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

    let get_album_index = async function (page_num) {
        var get_item_content = async function (div_item) {
            //console.log(`get_item_content`);
            var h3_title = await div_item.findElement(By.className(`item-title`));
            var str_title = await h3_title.getText();
            str_title = str_title.trim();
            var a_title = await h3_title.findElement(By.css(`a`));
            var herf_title = await a_title.getAttribute(`href`);
            if (!album_map[str_title]) {
                album_map[str_title] = {};
            }
            album_map[str_title].link = herf_title;
        };

        //console.log(`get_album_index(${page_num})`);
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
        return p.then(() => { return get_album_index(a); });
    }, Promise.resolve());
    return album_map;
};

var get_all_album_info_and_link = async function (driver, album_map) {
    var kv_arr = Object.entries(album_map);
    var http_timeout = app_config.http_timeout_extend * kv_arr.length;
    //console.log(`get_all_album_info_and_link(${kv_arr.length})`);

    let get_album_info_and_link = async function (kv_pair) {
        let get_li_content = async function (li_item) {
            var s = await li_item.getText();
            album_map[kv_pair[0]].tracks = [];

            if ((s.trim().length > 0) && (!app_config.ignore_items.includes(s))) {
                if (s.includes("Producer : ")) {
                    album_map[kv_pair[0]].producer = s.replace("Producer : ", "").trim();
                } else if (s.includes("Title : ")) {
                    album_map[kv_pair[0]].title = s.replace("Title : ", "").trim();
                } else if (s.includes("Release date : ")) {
                    album_map[kv_pair[0]].date = s.replace("Release date : ", "").trim();
                } else {
                    album_map[kv_pair[0]].tracks.push(s);
                }
            }
        };

        let get_a_content = async function (dl_link) {
            var s = await dl_link.getAttribute(`href`);
            album_map[kv_pair[0]].dl_links = [];
            if ((s.trim().length > 0) && (!app_config.ignore_items.includes(s))) {
                album_map[kv_pair[0]].dl_links.push(s);
            }
        };

        //console.log(`get_album_info_and_link(${kv_pair[0]})`);
        if (!kv_pair[1].link) { console.log("Warning: link is not found in the info entry!"); return; }
        await driver.get(kv_pair[1].link);
        await driver.wait(until.titleContains(kv_pair[0]), http_timeout, "Timeout: Waiting for album page");
        await driver.sleep(app_config.expected_loading_time);
        var li_arr = await driver.findElements(By.css(`li`));
        var dl_div = await driver.findElement(By.id(`Download-bar`));
        var dl_links = await dl_div.findElements(By.css(`a`));

        //var div_content = await driver.findElement(By.id(`widget-content-HTML4`));
        //var div_items = await div_content.findElements(By.className(`item-content`));
        //console.log(`${div_items.length} items found in page ${page_num}`)

        if (li_arr) {
            await li_arr.reduce((p, li_item) => {
                return p.then(() => { return get_li_content(li_item); });
            }, Promise.resolve());
        } else {
            console.log(`Error: no .li found!`);
        }

        if (dl_links) {
            await dl_links.reduce((p, dl_link) => {
                return p.then(() => { return get_a_content(dl_link); });
            }, Promise.resolve());
        } else {
            console.log(`Error: no #Download-bar .a found!`);
        }
    };

    await kv_arr.reduce((p, kv_pair) => {
        return p.then(() => { return get_album_info_and_link(kv_pair); });
    }, Promise.resolve());
    return album_map;
};

var get_dl_links = function (album_map) {
    var dl_links_hit = [];
    var dl_links_miss = [];
    Object.values(album_map).forEach((album_info) => {
        if (album_info.dl_links_hit) {
            dl_links_hit = dl_links_hit.concat(album_info.dl_links_hit);
        }
        if (album_info.dl_links_miss) {
            dl_links_miss = dl_links_miss.concat(album_info.dl_links_miss);
        }
    });
    dl_links_hit = dl_links_hit.sort();
    dl_links_miss = dl_links_miss.sort();
    return { dl_links_hit, dl_links_miss };
};

var try_bypass_adfly = async function (driver, album_map) {
    //ad_fly_skipper.called_by_9tensu_explore(driver, album_map, app_config.DL_SITES).then((new_map) => {
    //    console.log("then");
    //    return new_map;
    //});

    var called_by_9tensu_explore = async function (driver, album_map, dl_sites) {
        var kv_arr = Object.entries(album_map);

        var split_dl_links = async function (kv_pair) {
            let original_arr = kv_pair[1].dl_links;
            let hit_arr = [];
            let miss_arr = [];

            let match_pattern = function (s, a_p) {
                try {
                    return (s && a_p) ? a_p.includes(url.parse(s).host) : false;
                } catch (e) {
                    console.log(e);
                    return false;
                }
            };

            let p_fnc = function (original_link) {
                return new Promise((t, f) => {
                    ad_fly_skipper.wrapped_by_selenium(driver, original_link).then((modified_link) => {
                        //console.log(modified_link);
                        if (match_pattern(modified_link, dl_sites)) {
                            hit_arr.push(modified_link);
                        } else {
                            miss_arr.push(modified_link);
                        }
                        t();
                    }).catch((e) => {
                        console.log(e);
                        f();
                    });
                });
            };

            try {
                await original_arr.reduce((p, original_link) => {
                    return p.then(() => { return p_fnc(original_link); });
                }, Promise.resolve());
            } catch (e) {
                console.log(e);
            }

            album_map[kv_pair[0]].dl_links_hit = hit_arr;
            album_map[kv_pair[0]].dl_links_miss = miss_arr;
        };

        await kv_arr.reduce((p, kv_pair) => {
            return p.then(() => { return split_dl_links(kv_pair); });
        }, Promise.resolve());
        return album_map;
    };

    return await called_by_9tensu_explore(driver, album_map, app_config.DL_SITES);
};

//No throw. Keep progress.
var init = async function () {

    var driver = new Builder()
        .forBrowser(app_config.search_browser)
        .setChromeOptions(new chrome.Options()
            .addExtensions(app_config.AD_FLY_BYPASS)
            .setUserPreferences({ 'download.default_directory': app_config.target_dir }))
        .build();

    try {
        var page_count = await get_page_count(driver);
        console.log(`page_count = ${page_count}`);
        page_count = 1;
        var album_map_stage1 = await get_all_album_index(driver, page_count);
        await p_dump_writejson(app_config.explore_result_dump, album_map_stage1);

        var album_map_stage1 = await p_dump_readjson(app_config.explore_result_dump);

        console.log(`album_count = ${Object.keys(album_map_stage1).length}`);
        var album_map_stage2 = await get_all_album_info_and_link(driver, album_map_stage1);
        await p_dump_writejson(app_config.explore_result_dump, album_map_stage2);

        //var album_map_stage2 = await p_dump_readjson(app_config.explore_result_dump);
        //console.log(`album_count = ${Object.keys(album_map_stage2).length}`);

        var album_map_stage3 = await try_bypass_adfly(driver, album_map_stage2);
        await p_dump_writejson(app_config.explore_result_dump, album_map_stage3);

        console.log(`driver.quit()`);
        driver.quit();

        //return album_map_stage3;
        var dl_links_map = get_dl_links(album_map_stage3);
        
        return dl_links_map;
    } catch (e) {
        console.log(e);
        driver.quit();
    }

};


var exports = module.exports = {
    init: init
};