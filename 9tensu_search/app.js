const fs = require('fs');

const app_config = require("./app_modules/app_config.js");
const search = require("./app_modules/9tensu_search.js");
const rename_dir = require("./app_modules/rename_dir.js");
const search_codec = require("./app_modules/search_codec.js");

console.log(`Process start with PID ${process.pid}`);

var p_dump = function (album_map) {
    return new Promise((t, f) => {
        fs.writeFile(app_config.result_dump, JSON.stringify(album_map, null, 4), (err) => {
            if (err) { f(err); }
            else { t(album_map); }
        });
    });
};

var p_import_from_file = function () {
    return new Promise((t, f) => {
        fs.readFile(app_config.result_dump, 'utf8', (err, str) => {
            if (err) { f(err); }
            else {
                try {
                    t(JSON.parse(str));
                } catch (e) {
                    f(e);
                }
            }
        });
    });
};

/**
search.init().then((album_map) => {
//p_import_from_file().then((album_map) => {
    return p_dump(album_map);
}).then((album_map) => {
    return search_codec.init(album_map);
}).then((album_map) => {
    return rename_dir.init(album_map);
}).then(() => {
    console.log(`Process end.`);
}).catch(console.log);
**/

search_codec.test();