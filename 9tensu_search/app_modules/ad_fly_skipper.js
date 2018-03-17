"use strict";
const {
        Builder, By, Key, until
    } = require('selenium-webdriver');
const app_config = require("./app_config.js");

var wrapped_by_selenium = async function (driver, link) {
    var http_timeout = app_config.http_timeout_extend;

    //console.log(`wrapped_by_selenium(${link})`);

    //Assumption: Bypass plugin has been installed. Note that selenium only execute scripts when html body is loaded.
    //Seems only browser plugins can execute scripts before that.
    await driver.get(link);
    await driver.wait(until.elementLocated(By.css(`body`)), http_timeout, "Timeout: Waiting for adfly page");
    await driver.sleep(app_config.expected_loading_time_short);
    //This is to counter adfly locked page before the typical 5-second waiting.
    var div_warning = driver.findElements(By.id(`warning-container`));

    if (div_warning) {
        await driver.sleep(app_config.AD_FLY_TIMEOUT);
        await driver.get(link);
        //await driver.executeAsyncScript(wrapped_by_str); //await driver.get(dl_s);
        await driver.wait(until.elementLocated(By.css(`body`)), http_timeout, "Timeout: Waiting for adfly page again");
        await driver.sleep(app_config.expected_loading_time_short);
    }

    //This is to counter adfly redirect locking page. 
    var p_arr = await driver.findElements(By.css(`p`));
    var answer = null;

    var get_text = async function (p) {
        var s = await p.getText();
        s.split(" ").forEach((s) => {
            if (s.includes("http://") || s.includes("https://")) {
                answer = s;
            }
        });
    };

    //console.log(p_arr);

    if (!p_arr) {
        answer = await driver.getCurrentUrl();
    } else {
        await p_arr.reduce((q, p) => {
            return q.then(() => { return get_text(p); });
        }, Promise.resolve());
    }

    answer = answer ? answer : await driver.getCurrentUrl();

    //console.log({ link, answer });
    return answer;
};

var exports = module.exports = {
    wrapped_by_selenium: wrapped_by_selenium
};