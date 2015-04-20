var Path = require('path');

module.exports = exports = function (robot) {
    var path = Path.resolve(__dirname, 'src');
    robot.load(path);
};