//Guessing MP3 codec profile from bitrate: https://trac.ffmpeg.org/wiki/Encode/MP3

const async = require("async");
const ffprobe = require("ffprobe");
const ffprobeStatic = require("ffprobe-static");
const fs = require("fs");
const path = require("path");
const rreaddir = require("recursive-readdir");

const app_config = require("./app_config.js");
const get_directories = require("./get_directories.js");
const music_tag = require("./music_tag.js");
const path_str = require("./path_str.js");

const reconized_audio_format = [".wav", ".mp3", ".flac", ".ogg", ".m4a", ".wma", ".aac", ".mp2", ".mpa", ".mpga", ".mpu", "tiff"];
//const codec_str_audio_format = ["mp3", "vorbis", "aac", "pcm_s16le", "pcm_s16be", "wmav2"]; //Note: flac is not supported.
const codec_str_audio_format = ["mp3"];
const mp3_cbr = [8000, 16000, 24000, 32000, 40000, 48000, 64000, 80000, 96000, 112000, 128000, 160000, 192000, 224000, 256000, 320000];

var IsAudioFile = function (ext) {
    return reconized_audio_format.indexOf(ext.toLowerCase()) >= 0;
};

var p_dummy = function () {
    return new Promise((t, f) => { t(); });
};

var p_find_bitrate_ffmepg = function (info) {
    return new Promise((t, f) => {
        var target_stream = null;
        var bitrate = null;
        var vbr_level = null;
        if (!info.streams) {
            f(new Error("No stream info found!"));
        } else {
            info.streams.forEach((i) => { if (i.codec_type == "audio") { target_stream = i; } });
            if (!target_stream) {
                f(new Error("No audio stream info found!"));
            } else {
                //console.log(target_stream.codec_name);
                if (codec_str_audio_format.indexOf(target_stream.codec_name) < 0) {
                    t(null);
                } else {
                    bitrate = parseInt(target_stream.bit_rate);
                    if (isNaN(bitrate)) {
                        f(new Error("Invalid bitrate!"));
                    } else {
                        if (mp3_cbr.indexOf(bitrate) >= 0) {
                            t(Math.round(bitrate / 1000) + "K");
                        } else {
                            t("VBR"); //This may need to search for music tag...
                        }
                    }

                }
            }
        }
    });
};

var init = function (old_map) {
    return new Promise((t, f) => {
        var folder_arr = get_directories.init(app_config.target_dir);
        var album_info = null;
        var sample_audio = null;
        var sample_codec = null;
        var album_key = null; 
        var new_map = old_map;
        async.eachSeries(folder_arr, (folder_name, cb_in) => {
            album_info = path_str.partial_kv(old_map, path_str.unescape_path(folder_name));
            //Bug test
            album_key = path_str.k_by_partial_k(old_map, path_str.unescape_path(folder_name));
            if (!new_map[album_key]) {
                console.log(`Warning: ${album_key} is not in the map.`);
            }
            if (album_info) {
                rreaddir(path.join(app_config.target_dir, folder_name), (err, files) => {
                    if (err) { console.log(err.toString()); return cb_in(); }
                    else {
                        files = files.filter(file => IsAudioFile(path.parse(file).ext));
                        sample_audio = files.length > 0 ? files[0] : null;
                        if (sample_audio) {
                            ffprobe(sample_audio, { path: ffprobeStatic.path }, (err, info) => {
                                if (err) {
                                    console.log(err);
                                    new_map[album_key].codec = path.parse(sample_audio).ext.substring(1);
                                    return cb_in();
                                } else {
                                    p_find_bitrate_ffmepg(info).then((codec_str) => {
                                        if (!codec_str) {
                                            new_map[album_key].codec = path.parse(sample_audio).ext.substring(1);
                                            return cb_in();
                                        } else if (codec_str == "VBR") {
                                            music_tag.try_mm2(sample_audio).then((metadata) => {
                                                new_map[album_key].codec = (metadata && metadata.format && metadata.format.codecProfile) ? metadata.format.codecProfile : codec_str;
                                                return cb_in();
                                            }).catch((e) => {
                                                console.log(e);
                                                new_map[album_key].codec = codec_str;
                                                return cb_in();
                                            });
                                        } else {
                                            new_map[album_key].codec = codec_str;
                                            return cb_in();
                                        }
                                    }).catch((err) => {
                                        console.log(err);
                                        new_map[album_key].codec = path.parse(sample_audio).ext.substring(1);
                                        return cb_in();
                                    });
                                }
                            });
                        } else {
                            new_map[album_key].codec = null;
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
        "./dump/test.flac",
        "./dump/test.wav",
        "./dump/test.wma",
        "./dump/test2.wav",
        "./dump/testV4.mp3"
    ];
    async.each(files, (file, cb_in) => {
        ffprobe(file, { path: ffprobeStatic.path }, (err, info) => {
            if (err) { console.log(err); cb_in(); } else {
                p_find_bitrate_ffmepg(info).then((codec_str) => {
                    if (!codec_str) {
                        console.log(path.parse(file).ext.substring(1));
                        cb_in();
                    } else if (codec_str == "VBR") {
                        music_tag.try_mm2(file).then((metadata) => {
                            console.log((metadata && metadata.format && metadata.format.codecProfile) ? metadata.format.codecProfile : "VBR");
                            cb_in();
                        }).catch((e) => {
                            console.log(e);
                            cb_in();
                        });
                    } else {
                        console.log(codec_str);
                        cb_in();
                    }
                }).catch((e) => {
                    console.log(e);
                    cb_in();
                });
            }
            //console.log(err ? err : JSON.stringify(info, null, 4)); cb_in();
        });
    }, (err) => {
        console.log("Test end: " + err);
    });
};

var exports = module.exports = {
    init: init,
    test: test
};