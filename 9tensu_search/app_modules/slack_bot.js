"use strict";
const request = require("request");

var p_post = function (link, content) {
    return new Promise((t, f) => {
        request.post({
            url: link,
            form: JSON.stringify({ text: JSON.stringify(content, null, 4) })
        }, function (err, httpResponse, body) {
            if (err) { f(err); }
            else {
                if (httpResponse.statusCode !== 200) {
                    console.log(`${httpResponse.statusCode}: ${body} `);
                }
                t();
            }
        });
    });
};

var init = async function (link, content) {
    return await p_post(link, content);
};

var exports = module.exports = {
    init: init
};