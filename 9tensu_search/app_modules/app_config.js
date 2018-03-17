"use strict";
var exports = module.exports = {
    target_event: "C92", //Applies here only
    http_timeout_extend: 20000, //20 sec
    expected_loading_time: 5000, //5 sec
    expected_loading_time_short: 2000, //2 sec
    search_result_dump: "./dump/search_result.json",
    ignore_items: ["YouTube", "SoundCloud"],
    search_browser: 'chrome',
    default_codec_str: "IDK", //Should be handled by search_codec.
    doujinstyle_target: "http://www.doujinstyle.com/forum/viewtopic.php?id=17150",
    link_dump_hit: "./dump/link_dump_hit.txt",
    link_dump_miss: "./dump/link_dump_miss.txt",
    link_dump_pending: "./dump/link_dump_pending.txt",
    link_dump_wait: "./dump/link_dump_wait.txt",
    link_dump_wait_hit: "./dump/link_dump_wait_hit.txt",
    link_dump_wait_miss: "./dump/link_dump_wait_miss.txt",
    explore_result_dump: "./dump/explore_result.json",
    DL_SITES: ["mega.nz", "vk.com", "www.mediafire.com", "yadi.sk", "drive.google.com", "puu.sh", "leme.me", "docs.google.com"],
    AD_FLY_BYPASS: "./app_modules/AdSkipper_v4.1.3.crx",
    AD_FLY_TIMEOUT: 7000,
    MORE_AD_BYPASS: {
        crx: "./app_modules/Ads_Link_Skiper_1_3_19_0.crx",
        html: "chrome-extension://bkpeohkfimdfogdnpcnokjkbpankkmil/popup/popup.html"
    },
    AD_BLOCK: "./app_modules/AdBlock_3_27_0_0.crx",
    SLACK_WEB_HOOK: "https://hooks.slack.com/services/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"
};

exports.target_dir = `F:/DammK/Doujin Music/${exports.target_event}/Temp`;