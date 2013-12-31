/*jslint nomen: true, vars: true */
/*global jQuery:false, _:false, Backbone: false, console: false, rivets: false*/

(function ($, _, Backbone, rivets) {
    'use strict';

    var INTERVAL = 10 * 1000,
        msgs = null,
        model = null,
        intervalId = null;

    rivets.adapters[':'] = {
        subscribe: function (obj, keypath, callback) {
            obj.on('change:' + keypath, callback);
        },
        unsubscribe: function (obj, keypath, callback) {
            obj.off('change:' + keypath, callback);
        },
        read: function (obj, keypath) {
            var result = obj.get(keypath);
            return result instanceof Backbone.Collection ? result.toArray() : result;
        },
        publish: function (obj, keypath, value) {
            obj.set(keypath, value);
        }
    };

    rivets.formatters.date = function (value) {
        return moment(value).format('hh:mm:ss MM.DD.YYYY');
    };

    var Chat = Backbone.Model.extend({
        initialize: function (attrs) {
            var _this = this;
            attrs.msgs.on('add', function () {
                _this.trigger('change:msgs');
            });
        }
    });

    $(function () {
        var msgsNode = $('#msgs');

        $.ajax({
            type: 'GET',
            url: '/proxy/api/last/50'
        }).success(function (data) {
            msgs = new Backbone.Collection(data.msgs);
            model = new Chat({msgs: msgs});
            rivets.bind(msgsNode, {model: model});

            intervalId = setInterval(function () {
                var maxSeq = model.get('msgs').reduce(function (result, message) {
                    return Math.max(result, message.get('seq'));
                }, 0);

                $.ajax({
                    type: 'GET',
                    url: '/proxy/api/new/' + maxSeq
                }).success(function (data) {
                    model.get('msgs').push(data.msgs);
                });
            }, INTERVAL);
        });
    });

}(jQuery, _, Backbone, rivets));
