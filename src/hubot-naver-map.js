// Description:
//   Interacts with the Naver Map API.
//
// Configuration:
//   HUBOT_NAVER_SEARCH_IDENTIFIER
//   HUBOT_NAVER_SEARCH_KEY
//   HUBOT_NAVER_MAP_IDENTIFIER
//   HUBOT_NAVER_MAP_KEY
//   HUBOT_NAVER_USE_UNOFFICIAL_PLACE_SEARCH_API
//
// Commands:
//   hubot navermap me <query> - Returns a map view of the area returned by `query` which served by NAVER.
//   hubot 네이버지도 <검색어> - 제공한 `검색어`를 기반으로 네이버 지도에서 검색을 수행하고, 결과를 반환합니다.

/*!
 * hubot-naver-map v1.0.0
 * http://github.com/mooyoul/hubot-naver-map
 * (c) 2015 Moo Yeol, Lee
 *
 * hubot-naver-map may be freely distributed under the MIT license.
 */

'use strict';

/** Module Dependencies. */
var _ = require('underscore'),
    Promise = require('bluebird'),
    requestAsync = require('request'),
    request = Promise.promisify(requestAsync),
    xml2js = require('xml2js'),
    parseXMLString = Promise.promisify(xml2js.parseString),
    sanitizeHtml = require('sanitize-html'),
    qs = require('querystring'),
    url = require('url');


/** Configurations */
var requiredEnvNames = [
    'HUBOT_NAVER_SEARCH_IDENTIFIER',
    'HUBOT_NAVER_SEARCH_KEY',
    'HUBOT_NAVER_MAP_IDENTIFIER',
    'HUBOT_NAVER_MAP_KEY'
];
_.every(requiredEnvNames, function (name) {
    if(typeof process.env[name] === 'undefined') {
        console.error('Missing ' + name + ' in environment: please set and try again.');
        process.exit(1);
    }
});
_.chain(requiredEnvNames)
    .filter(function (name) {
        return name.indexOf('IDENTIFIER') !== -1
    })
    .every(function (name) {
        try {
            url.parse(process.env[name]);
        } catch (e) {
            console.error('Invalid ' + name + ' in environment: please set to correct url and try again.');
            process.exit(1);
        }
    });

var CONFIG = {
    API: {
        PLACE_SEARCH: {
            ENDPOINT: 'http://openapi.naver.com/search',
            METHOD: 'GET',
            HEADERS: {
                Referer: process.env['HUBOT_NAVER_SEARCH_IDENTIFIER']
            },
            PARAMS: {
                key: process.env['HUBOT_NAVER_SEARCH_KEY'],
                target: 'local',
                start: 1,
                display: 10
            }
        },
        GEOCODE: {
            ENDPOINT: 'http://openapi.map.naver.com/api/geocode.php',
            METHOD: 'GET',
            HEADERS: {
                Referer: process.env['HUBOT_NAVER_MAP_IDENTIFIER']
            },
            PARAMS: {
                key: process.env['HUBOT_NAVER_MAP_KEY'],
                encoding: 'utf-8',
                coord: 'tm128'
            }
        },
        STATIC_MAP: {
            ENDPOINT: 'http://openapi.naver.com/map/getStaticMap',
            METHOD: 'GET',
            HEADERS: {
                Referer: process.env['HUBOT_NAVER_MAP_IDENTIFIER']
            },
            PARAMS: {
                version: '1.1',
                key: process.env['HUBOT_NAVER_MAP_KEY'],
                uri: url.parse(process.env['HUBOT_NAVER_MAP_IDENTIFIER']).host,
                level: 11,
                crs: 'NHN:128',
                exception: 'inimage',
                w: 640,
                h: 640,
                baselayer: 'default',
                maptype: 'default',
                format: 'png'
            }
        },
        UNOFFICIAL_PLACE_SEARCH: {
            ENDPOINT: 'http://map.naver.com/search2/local.nhn',
            METHOD: 'GET',
            PARAMS: {}
        },
        PLACE_INFO: {
            ENDPOINT: 'http://map.naver.com/local/siteview.nhn?code=',
            METHOD: 'GET',
            PARAMS: {}
        },
        APP_LINK: {
            ENDPOINT: 'http://map.naver.com/',
            METHOD: 'GET',
            PARAMS: {
                version: 10,
                app: 'Y',
                appMenu: 'location',
                pinType: 'site'
            }
        }
    }
};


/** Place Search Promise */
var placeSearch = function placeSearch (query) {
    if(! query) {
        return Promise.reject(new Error('query is empty.'));
    }

    return request({
        url: CONFIG.API.PLACE_SEARCH.ENDPOINT,
        method: CONFIG.API.PLACE_SEARCH.METHOD,
        headers: CONFIG.API.PLACE_SEARCH.HEADERS,
        qs: _.defaults({
            query: query
        }, CONFIG.API.PLACE_SEARCH.PARAMS)
    }).then(function (body) {
        var xhr = body[0],
            res = body[1];

        if(xhr.statusCode !== 200) {
            return Promise.reject(new Error('bad response from server.'));
        }

        return parseXMLString(res, {
            ignoreAttrs: true,
            explicitArray: false
        });
    }).then(function (res) {
        if(res['error']) {
            return Promise.reject(new Error('request rejected from server'));
        }

        var feed = res['rss'] && res['rss']['channel'];
        if(! (feed && feed['item'])) {
            return Promise.reject(new Error('empty response'));
        }


        var item = feed['item'] instanceof Array ?
                        feed['item'][0] :
                        feed['item'];
        item['title'] = sanitizeHtml(item['title'], {
            allowedTags: []
        });

        item['description'] = sanitizeHtml(item['description'], {
            allowedTags: []
        });

        return Promise.resolve(item);
    });
};


/** Geocode Promise */
var geocode = function geocode (query) {
    if(! query) {
        return Promise.reject(new Error('query is empty.'));
    }

    return request({
        url: CONFIG.API.GEOCODE.ENDPOINT,
        method: CONFIG.API.GEOCODE.METHOD,
        headers: CONFIG.API.GEOCODE.HEADERS,
        qs: _.defaults({
            query: query
        }, CONFIG.API.GEOCODE.PARAMS)
    }).then(function (body) {
        var xhr = body[0],
            res = body[1];

        if(xhr.statusCode !== 200) {
            return Promise.reject(new Error('bad response from server.'));
        }

        return parseXMLString(res, {
            ignoreAttrs: true,
            explicitArray: false
        });
    }).then(function (res) {
        if(res['error']) {
            return Promise.reject(new Error('request rejected from server'));
        }

        var feed = res['geocode'];
        if(! (feed && feed['item'])) {
            return Promise.reject(new Error('empty response'));
        }

        var item = feed['item'] instanceof Array ?
                        feed['item'][0] :
                        feed['item'];


        return Promise.resolve(item);
    });
};


/** Static Map Promise */
var generateStaticMapUrl = function generateStaticMapUrl (x, y, coordType) {
    if(!(x && y)) {
        return Promise.reject(new Error('x (lat) or y (lng) is empty.'));
    }
    return CONFIG.API.STATIC_MAP.ENDPOINT +
            '?' +
            qs.stringify(_.defaults({
                center: x + ',' + y,
                markers: x + ',' + y,
                crs: coordType || CONFIG.API.STATIC_MAP.PARAMS.crs
            }, CONFIG.API.STATIC_MAP.PARAMS));
};


/** Unofficial Place Search Promise */
var unofficialPlaceSearch = function unofficialPlaceSearch (query) {
    if(! query) {
        return Promise.reject(new Error('query is empty.'));
    }

    return request({
        url: CONFIG.API.UNOFFICIAL_PLACE_SEARCH.ENDPOINT,
        method: CONFIG.API.UNOFFICIAL_PLACE_SEARCH.METHOD,
        qs: {
            query: query
        }
    }).then(function (body) {
        var xhr = body[0],
            res = body[1];

        if(xhr.statusCode !== 200) {
            return Promise.reject(new Error('bad response from server.'));
        }


        if(typeof res === 'string') {
            try {
                res = JSON.parse(res);
            } catch (e) {
                return Promise.reject(e);
            }
        }


        return Promise.resolve(res['result']);
    }).then(function (result) {
        if(! (result && result.code === '0')) {
            return Promise.reject(new Error('bad response from server.'));
        }

        if((result.code !== '1') &&
                !(result['site'] && result['site'].list &&
                result['site'].list.length)) {

            return Promise.reject(new Error('empty response'));
        }

        var place = result['site'].list[0];

        return Promise.resolve({
            title: sanitizeHtml(place.name, {allowedTags: []}),
            description: sanitizeHtml(place.description, {allowedTags: []}),
            address: sanitizeHtml(place.address, {allowedTags: []}),
            telephone: place['tel'],
            coords: {
                x: place['x'],
                y: place['y'],
                type: 'EPSG:4326'
            },
            link: CONFIG.API.PLACE_INFO.ENDPOINT + place.id.substr(1),
            appLink: CONFIG.API.APP_LINK.ENDPOINT + '?' +
                qs.stringify(_.extend({
                    pinId: place.id.substr(1),
                    lat: place['y'],
                    lng: place['x'],
                    title: sanitizeHtml(place.name, {allowedTags: []})
                }, CONFIG.API.APP_LINK.PARAMS)
            )
        });
    });
};



var send = function (msg, place) {
    msg.send(
        generateStaticMapUrl(place['coords']['x'], place['coords']['y'], place['coords']['type'])
    );
    msg.send(
        _.chain([
            '[네이버 지도]' + place.title,
            place['telephone'],
            place.address,
            place.description,
            '\n',
            place.link,
            place.appLink && ('네이버 지도 앱에서 열기: ' + place.appLink)
        ]).compact()
            .value()
            .join('\n')
    );
};

var handler = function (msg) {
    var query = msg.match[2],
        useUnofficial = process.env['HUBOT_NAVER_USE_UNOFFICIAL_PLACE_SEARCH_API'];


    if((useUnofficial === '1') || useUnofficial === 'true') {
        unofficialPlaceSearch(query)
            .then(function (place) {
                send(msg, place);
            });
        return;
    }


    placeSearch(query)
        .then(function (place) { // place exists
            if(place['link'] && place['mapx'] && place['mapy']) {
                send(msg, _.extend(place, {
                    coords: {x: place['mapx'], y: place['mapy']}
                }));
            } else if(place['address']) {
                geocode(place.address)
                    .then(function (coord) {
                        send(msg, _.extend(coord, {
                            title: query,
                            coords: coord['point']
                        }));
                    });
            }
        }).catch(function (e) { // place not exists.
            geocode(query)
                .then(function (coord) {
                    send(msg, _.extend(coord, {
                        title: query,
                        coords: coord['point']
                    }));
                });
        });
};


module.exports = exports = function (robot) {
    // Register Handler
    robot.respond(/(?:네이버?지도|지도|naver?map)( me)? (.*)/i, handler);
};


