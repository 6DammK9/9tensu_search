"use strict";
const {
    Builder, By, Key, until
} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const app_config = require("./app_config.js");

var init = function () {
    return new Builder()
        .forBrowser(app_config.search_browser)
        .setChromeOptions(new chrome.Options()
            .addExtensions(app_config.AD_FLY_BYPASS)
            .addExtensions(app_config.MORE_AD_BYPASS.crx)
            .addExtensions(app_config.AD_BLOCK)
            .setUserPreferences({
                'download.default_directory': app_config.target_dir
                //'download.prompt_for_download': false
            }))
        .build();

};

var exports = module.exports = {
    init: init
};