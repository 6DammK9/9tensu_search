var escape_path = function (bad_str, escape_numbers) {
    //Escape incompatiable character from half width to full width. Should be in utf-8.
    //Somehow 9tensu escape numbers also. Strange.
    var m = [
        [/\\/g, "＼"],
        [/\//g, "／"],
        [/\:/g, "："],
        [/\*/g, "＊"],
        [/\?/g, "？"],
        [/\"/g, "＂"],
        [/\</g, "＜"],
        [/\>/g, "＞"],
        [/\|/g, "｜"]
    ];
    if (escape_numbers) {
        m = m.concat([
            [/0/g, "０"],
            [/1/g, "１"],
            [/2/g, "２"],
            [/3/g, "３"],
            [/4/g, "４"],
            [/5/g, "５"],
            [/6/g, "６"],
            [/7/g, "７"],
            [/8/g, "８"],
            [/9/g, "９"]
        ]);
    };

    //console.log(m);

    try {
        m.forEach((a) => {
            bad_str = bad_str.replace(a[0], a[1]);
        });
        return bad_str;
    } catch (e) {
        console.log(e); //Should not happen
        return bad_str;
    }
};

var unescape_path = function (bad_str) {
    //Escape incompatiable character from half width to full width. Should be in utf-8.
    var m = [
        [/＼/g, "\\"],
        [/／/g, "\/"],
        [/：/g, "\:"],
        [/＊/g, "\*"],
        [/？/g, "\?"],
        [/＂/g, "\""],
        [/＜/g, "\<"],
        [/＞/g, "\>"],
        [/｜/g, "\|"],
        [/０/g, "0"],
        [/１/g, "1"],
        [/２/g, "2"],
        [/３/g, "3"],
        [/４/g, "4"],
        [/５/g, "5"],
        [/６/g, "6"],
        [/７/g, "7"],
        [/８/g, "8"],
        [/９/g, "9"]
    ];
    try {
        m.forEach((a) => {
            bad_str = bad_str.replace(a[0], a[1]);
        });
        return bad_str;
    } catch (e) {
        console.log(e); //Should not happen
        return bad_str;
    }
};

var partial_kv = function (m, t_k) {
    var a_k = Object.keys(m).filter(k => k.indexOf(t_k) >= 0);
    return a_k.length > 0 ? m[a_k[0]] : undefined;
};


var k_by_partial_k = function (m, t_k) {
    var a_k = Object.keys(m).filter(k => k.indexOf(t_k) >= 0);
    return a_k.length > 0 ? a_k[0] : undefined;
};

var exports = module.exports = {
    escape_path: escape_path,
    unescape_path: unescape_path,
    partial_kv: partial_kv,
    k_by_partial_k: k_by_partial_k
};