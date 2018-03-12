var exports = module.exports = {
    target_event: "C92", //Applies here only
    http_timeout_extend: 20000, //20 sec
    expected_loading_time: 5000, //5 sec
    expected_loading_time_short: 2000, //2 sec
    search_result_dump: "./dump/search_result.txt",
    ignore_items: ["YouTube", "SoundCloud"],
    search_browser: 'chrome',
    default_codec_str: "IDK", //Should be handled by search_codec.
    doujinstyle_target: "http://www.doujinstyle.com/forum/viewtopic.php?id=16646",
    link_dump_hit: "./dump/link_dump_hit.txt",
    link_dump_miss: "./dump/link_dump_miss.txt",
    link_dump_pending: "./dump/link_dump_pending.txt",
    link_dump_wait: "./dump/link_dump_wait.txt",
    link_dump_wait_hit: "./dump/link_dump_wait_hit.txt",
    link_dump_wait_miss: "./dump/link_dump_wait_miss.txt",
    explore_result_dump: "./dump/explore_result.txt",
    DL_SITES: ["mega.nz", "vk.com", "www.mediafire.com", "yadi.sk", "drive.google.com", "puu.sh", "leme.me", "docs.google.com"],
    AD_FLY_BYPASS: "./app_modules/AdSkipper_v4.1.3.crx",
    AD_FLY_TIMEOUT: 7000
};

exports.target_dir = `E:/DammK/Doujin Music/${exports.target_event}/Temp`;