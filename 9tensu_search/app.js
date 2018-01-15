const fs = require('fs');

var app_config = require("./app_modules/app_config.js");
var search = require("./app_modules/9tensu_search.js");

console.log(`Process start with PID ${process.pid}`);
search.init((err, album_map) => {
    if (err) { console.log(err); }
    try {
        fs.writeFileSync(app_config.result_dump, JSON.stringify(album_map, null, 4));
    } catch (e) {
        console.log(e);
    }
    console.log(`Process end.`);
});