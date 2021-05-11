const fs = require('fs');

module.exports.readToJSON = function(path) {
    let data = fs.readFileSync(path, "utf8");
    return JSON.parse(data);
}

module.exports.writeToJSON = function(path, obj) {
    const data = JSON.stringify(obj, null, 2);
    fs.writeFileSync(path, data);
    return data;
}