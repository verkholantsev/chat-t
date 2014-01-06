/*jslint nomen: true, vars: true */
/*global jQuery:false, _:false, Backbone: false, console: false, rivets: fals, window:falsee*/

(function ($, _, Backbone, rivets, window) {
    'use strict';

    var INTERVAL = 10 * 1000,
        SCROLL_DELTA = 100,
        SPECIAL_NICKS = ['umputun', 'bobuk', '[bobuk]'],
        BOT_NICKS = ['jc-radio-t'],
        GET_URL = '/api/last/50',
        NEW_URL = '/api/new/',
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
        return moment(value).format('HH:mm:ss');
    };

    var Message = Backbone.Model.extend({
        parse: function (attrs) {
            if (SPECIAL_NICKS.indexOf(attrs.from.toLowerCase()) > -1) {
                attrs.special = true;
            }

            if (BOT_NICKS.indexOf(attrs.from.toLowerCase()) > -1) {
                attrs.bot = true;
            }

            return attrs;
        }
    });

    var Messages = Backbone.Collection.extend({
        model: Message
    });

    var Chat = Backbone.Model.extend({
        defaults: {
            debug: false,
            inited: false,
            scrollEnabled: true
        },
        initialize: function (attrs) {
            var _this = this;
            attrs.msgs.on('add', function () {
                _this.trigger('change:msgs');
            });

            $(window).on('scroll', this.watchScroll.bind(this));
        },
        watchScroll: function () {
            var viewportHeight = $(window).height(),
                documentHeight = $(window.document).height(),
                scrollTop = $(window.document).scrollTop();

            this.set('documentHeight', documentHeight);
            this.set('viewportHeight', viewportHeight);
            this.set('scrollTop', scrollTop);
            this.set('scrollTopPlusDelta', scrollTop + SCROLL_DELTA);
            this.set('scrollEnabled', documentHeight - viewportHeight <= scrollTop + SCROLL_DELTA);
        },
        updateScroll: function () {
            var documentHeight = $(window.document).height();
            if (this.get('scrollEnabled')) {
                $('html,body').animate({scrollTop: documentHeight});
            }
        }
    });

    $(function () {
        var msgsNode = $('#msgs');

        $.ajax({
            type: 'GET',
            url: GET_URL
        }).success(function (data) {
            msgs = new Messages(data.msgs, {parse: true});
            model = new Chat({msgs: msgs});
            rivets.bind(msgsNode, {model: model});
            model.set('inited', true);
            model.updateScroll();

            intervalId = setInterval(function () {
                var maxSeq = model.get('msgs').reduce(function (result, message) {
                    return Math.max(result, message.get('seq'));
                }, 0);

                $.ajax({
                    type: 'GET',
                    url: NEW_URL + maxSeq
                }).success(function (data) {
                    model.get('msgs').push(data.msgs, {parse: true});
                    model.updateScroll();
                });
            }, INTERVAL);
        }).error(function () {
            console.log(arguments);
        });
    });

}(jQuery, _, Backbone, rivets, window));
