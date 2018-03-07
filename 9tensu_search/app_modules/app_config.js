var exports = module.exports = {
    target_event: "C91", //Applies here only
    http_timeout_extend: 20000, //20 sec
    search_result_dump: "./dump/result.txt",
    ignore_items: ["YouTube", "SoundCloud"],
    search_browser: 'chrome',
    default_codec_str: "IDK", //Should be handled by search_codec.
    doujinstyle_target: "http://www.doujinstyle.com/forum/viewtopic.php?id=16646",
    link_dump_hit: "./dump/hit.txt",
    link_dump_miss: "./dump/miss.txt"
};

exports.target_dir = `E:/DammK/Doujin Music/${exports.target_event}/Temp`;
exports.expected_loading_time = function () {
    return Math.round(Math.random() * 250) + 5000; //5 sec
}; 