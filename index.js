/*jslint nomen: true, vars: true*/
/*global require: false, __dirname: false*/

(function () {
    'use strict';

    var PORT = 8080,
        http = require('http'),
        express = require('express'),
        server = express();

    server.use(express['static'](__dirname + '/public'));

    server.get(/proxy(.*)/, function (req, res) {
        var url = req.params[0];
        http.get('http://chat.radio-t.com' + url, function (result) {
            var data = '';
            result.on('data', function (chunck) {
                data += chunck;
            });

            result.on('end', function () {
                res.setHeader('Content-Type', 'application/json');
                res.write(data.toString('utf-8'));
                res.end();
            });
        });
    });

    server.listen(PORT);
}());
