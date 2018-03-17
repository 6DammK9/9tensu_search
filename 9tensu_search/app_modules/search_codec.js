"use strict";
//Guessing MP3 codec profile from bitrate: https://trac.ffmpeg.org/wiki/Encode/MP3

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
    return reconized_audio_format.includes(ext.toLowerCase());
};

var p_dummy = function () {
    return new Promise((t, f) => { t(); });
};

var p_find_bitrate_ffmepg = async function (info) {
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
                if (!codec_str_audio_format.includes(target_stream.codec_name)) {
                    t(null);
                } else {
                    bitrate = parseInt(target_stream.bit_rate);
                    if (isNaN(bitrate)) {
                        f(new Error("Invalid bitrate!"));
                    } else {
                        if (mp3_cbr.includes(bitrate)) {
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

var p_ffprobe = async function (sample_audio) {
    return new Promise((t, f) => {
        ffprobe(sample_audio, { path: ffprobeStatic.path }, (err, info) => {
            t({ err, info });
        });
    });
};

var init = async function (old_map) {
    var folder_arr = get_directories.init(app_config.target_dir);
    var sample_audio = null;
    var sample_codec = null;
    var album_key = null;
    var new_map = old_map;

    var p_update_map = async function (folder_name) {
        album_key = path_str.k_by_partial_k(old_map, path_str.unescape_path(folder_name));
        if (!album_key) {
            console.log(`Warning: Key ${path_str.unescape_path(folder_name)} is not in the map.`);
            console.log(`Retrying Key ${path_str.escape_path(folder_name)}...`);
            album_key = path_str.k_by_partial_k(old_map, path_str.escape_path(folder_name, true));
        }
        if (!album_key) {
            console.log(`Warning: Key ${path_str.unescape_path(folder_name)} is not in the map.`);
        } else if (!new_map[album_key]) {
            console.log(`Warning: Value ${album_key} is not in the map.`);
        } else {
            var files = await rreaddir(path.join(app_config.target_dir, folder_name));
            files = files.filter(file => IsAudioFile(path.parse(file).ext));
            sample_audio = files.length > 0 ? files[0] : null;
            if (sample_audio) {
                var ffprobe_result = await p_ffprobe(sample_audio);
                if (ffprobe_result.err) {
                    console.log(ffprobe_result.err);
                    new_map[album_key].codec = path.parse(sample_audio).ext.substring(1);
                } else {
                    var codec_str = null;
                    var metadata = null;
                    try {
                        codec_str = await p_find_bitrate_ffmepg(ffprobe_result.info);
                        if (!codec_str) {
                            new_map[album_key].codec = path.parse(sample_audio).ext.substring(1);
                        } else if (codec_str == "VBR") {
                            try {
                                metadata = await music_tag.try_mm2(sample_audio);
                                new_map[album_key].codec = (metadata && metadata.format && metadata.format.codecProfile) ? metadata.format.codecProfile : codec_str;
                            } catch (e_mm2) {
                                console.log(e_mm2);
                                new_map[album_key].codec = codec_str;
                            }
                        } else {
                            new_map[album_key].codec = codec_str;
                        }
                    } catch (e_p) {
                        console.log(e_p);
                        new_map[album_key].codec = path.parse(sample_audio).ext.substring(1);
                    }
                }
            } else {
                new_map[album_key].codec = null;
            }
        }
    };

    await folder_arr.reduce((p, folder_name) => {
        return p.then(() => { return p_update_map(folder_name); });
    }, Promise.resolve());

    return new_map;
};

var test = async function () {
    var files = [
        "./dump/test.mp3",
        //"./dump/test.ogg",
        //"./dump/test.mp4",
        //"./dump/testV0.mp3",
        "./dump/test.flac",
        //"./dump/test.wav",
        "./dump/test.wma",
        //"./dump/test2.wav",
        "./dump/testV4.mp3"
    ];

    var p_ffprobe = async function (file) {
        var ffprobe_result = await p_ffprobe(file);
        if (ffprobe_result.err) { throw err; } else {
            var codec_str = await p_find_bitrate_ffmepg(ffprobe_result.info);
            if (!codec_str) {
                console.log(path.parse(file).ext.substring(1));
            } else if (codec_str == "VBR") {
                var metadata = await music_tag.try_mm2(file);
                console.log((metadata && metadata.format && metadata.format.codecProfile) ? metadata.format.codecProfile : "VBR");
            } else {
                console.log(codec_str);
            }
        }
        //console.log(err ? err : JSON.stringify(ffprobe_result.info, null, 4));
    };

    //async.eachSeries
    await files.reduce((p, file) => {
        return p.then(() => { return p_ffprobe(file); });
    }, Promise.resolve());
};

var exports = module.exports = {
    init: init,
    test: test
};