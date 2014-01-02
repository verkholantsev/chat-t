/*jslint nomen: true, vars: true */
/*global jQuery:false, _:false, Backbone: false, console: false, rivets: fals, window:falsee*/

(function ($, _, Backbone, rivets, window) {
    'use strict';

    var INTERVAL = 10 * 1000,
        SPECIAL_NICKS = ['umputun', 'bobuk'],
        BOT_NICKS = ['jc-radio-t'],
        GET_URL = '/proxy/api/last/50',
        NEW_URL = '/proxy/api/new/',
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

    rivets.formatters.escape = function (value) {
        return $('<div>').text(value).html();
    };

    rivets.binders.special = function (node, value) {
        if (value) {
            $(node).addClass('special');
        } else {
            $(node).removeClass('special');
        }
    };

    rivets.binders.bot = function (node, value) {
        if (value) {
            $(node).addClass('bot');
        } else {
            $(node).removeClass('bot');
        }
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
        initialize: function (attrs) {
            var _this = this;
            attrs.msgs.on('add', function () {
                _this.trigger('change:msgs');
            });
        }
    });

    var needToScroll = true;
    function watchScroll () {
        var viewportHieght = $(window).height(),
            documentHeight = $(window.document).height(),
            scrollTop = $(window.document).scrollTop();

        needToScroll = documentHeight - viewportHieght <= scrollTop;
    }

    function updateScroll () {
        var documentHeight = $(window.document).height();
        if (needToScroll) {
            $('html,body').animate({scrollTop: documentHeight});
        }
    }

    $(function () {
        var msgsNode = $('#msgs');

        $.ajax({
            type: 'GET',
            url: GET_URL
        }).success(function (data) {
            msgs = new Messages(data.msgs, {parse: true});
            model = new Chat({msgs: msgs});
            rivets.bind(msgsNode, {model: model});

            updateScroll();
            $(window.document).on('scroll', watchScroll);

            intervalId = setInterval(function () {
                var maxSeq = model.get('msgs').reduce(function (result, message) {
                    return Math.max(result, message.get('seq'));
                }, 0);

                $.ajax({
                    type: 'GET',
                    url: NEW_URL + maxSeq
                }).success(function (data) {
                    model.get('msgs').push(data.msgs, {parse: true});
                    updateScroll();
                });
            }, INTERVAL);
        }).error(function () {
            console.log(arguments);
        });
    });

}(jQuery, _, Backbone, rivets, window));
