const async = require("async");
const ffprobe = require("ffprobe");
const ffprobeStatic = require("ffprobe-static");
const fs = require("fs");
const path = require("path");

const app_config = require("./app_config.js");
const get_directories = require("./get_directories.js");

const reconized_audio_format = [".wav", ".mp3", ".flac", ".ogg", ".m4a", ".wma", ".aac", ".mp2", ".mpa", ".mpga", ".mpu"];

var IsAudioFile = function (ext) {
    return reconized_audio_format.indexOf(ext.toLowerCase()) >= 0;
};

var init = function (old_map) {
    return new Promise((t, f) => {
        var folder_arr = get_directories.init(app_config.target_dir);
        var album_info = false;
        var sample_audio = false;
        var new_map = old_map;
        async.eachSeries(folder_arr, (folder_name, cb_in) => {
            album_info = old_map[folder_name];
            if (album_info) {
                fs.readdir(path.join(app_config.target_dir, folder_name), (err, files) => {
                    if (err) { console.log(err.toString()); return cb_in(); }
                    else {
                        files = files.filter(file => IsAudioFile(path.parse(file).ext));
                        sample_audio = files.length > 0 ? files[0] : null;
                        if (sample_audio) {
                            ffprobe(path.join(app_config.target_dir, folder_name, sample_audio), { path: ffprobeStatic.path }, (err, info) => {
                                if (err) {
                                    console.log(err);
                                    new_map[folder_name].codec = path.parse(sample_audio).ext.substring(1);
                                    return cb_in();
                                } else {
                                    //console.log(info);
                                    try {
                                        //Do something with info
                                    } catch (e) {
                                        console.log(e);
                                        new_map[folder_name].codec = path.parse(sample_audio).ext.substring(1);
                                        return cb_in();
                                    }
                                    return cb_in();
                                }
                            });
                        } else {
                            new_map[folder_name].codec = null;
                            return cb_in();
                        }
                    }
                });
            } else {
                return cb_in();
            }
        }, (err) => {
            if (err) { f(err); }
            else { t(new_map); }
        });
    });
};

var test = function () {
    var files = [
        "./dump/test.mp3",
        "./dump/test.ogg",
        "./dump/test.mp4",
        "./dump/testV0.mp3",
        "./dump/test.flac"
    ];
    async.each(files, (file, cb_in) => {
        ffprobe(file, { path: ffprobeStatic.path }, (err, info) => {
            console.log(err ? err : JSON.stringify(info, null, 4));
            cb_in();
        });
    }, (err) => {
        console.log("Test end: " + err);
    });
};

var exports = module.exports = {
    init: init,
    test: test
};