//Credit: pravdomil and Mikal Madsen
//Source: https://stackoverflow.com/questions/18112204/get-all-directories-within-directory-nodejs

const fs = require('fs');
const path = require('path');

var get_directories = function (p) {
    return fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());
};

var exports = module.exports = {
    init: get_directories
};