const fs = require('fs');

var app_config = require("./app_modules/app_config.js");
var search = require("./app_modules/9tensu_search.js");
var rename_dir = require("./app_modules/rename_dir.js");

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

//console.log(p_import_from_file());

search.init().then((album_map) => {
    //p_import_from_file().then((album_map) => {
    return p_dump(album_map);
}).then((album_map) => {
    return rename_dir.init(album_map);
}).then(() => {
    console.log(`Process end.`);
}).catch(console.log);
