# hubot-naver-map

hubot-naver-map is similar with hubot-google-map.
but it returns rich contents like static map image, place info url, telephone number, address, and app link.


## Installation:
Add the latest version of `hubot-naver-map` to your package.json:
```sh
npm install hubot-naver-map --save
```
After installation, just add `hubot-naver-map` into your `external-scripts.json` file.

## Configuration:
All of configuration values uses environment value.

##### HUBOT_NAVER_SEARCH_IDENTIFIER
API Identifier of Naver Search API
e.g) http://debug.so/

See: https://developer.naver.com/openapi/register.nhn

##### HUBOT_NAVER_SEARCH_KEY
API Key of Naver Search API
e.g) c1b406b32dbbbbeee5f2a36ddc14067f

See: https://developer.naver.com/openapi/register.nhn


##### HUBOT_NAVER_MAP_IDENTIFIER
API Identifier of Naver Maps API
e.g) http://debug.so/

See: https://developer.naver.com/openapi/register.nhn

##### HUBOT_NAVER_MAP_KEY
API Key of Naver Maps API
e.g) c1b406b32dbbbbeee5f2a36ddc14067f

See: https://developer.naver.com/openapi/register.nhn

## Usage:
```sh
hubot navermap me <query>
hubot 네이버지도 <검색어>
```


## License:
The MIT License (MIT)
Copyright (c) 2014 Moo Yeol, Lee (Prescott)

See full license: https://github.com/mooyoul/hubot-naver-map/blob/master/LICENSE