const http = require('http');
const _request = require('request');
const https = require('https');
const config = require('../config.json');

function request(url, cookies) {
  return new Promise(function (resolve, reject) {
    _request({
      headers: {
        'Cookie': cookies
      },
      uri: url
    }, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}

function getCookies(callback){
  return new Promise(function (resolve, reject) {
    _request({
      headers: {
          'Origin': 'https://www.ivoox.com',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'es-419,es;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': '*/*',
          'Referer': 'https://www.ivoox.com/',
          'X-Requested-With': 'XMLHttpRequest',
          'Connection': 'keep-alive',
          'Cookie': 'countAudios=5; countaudioplay=a%3A3%3A%7Bi%3A36911382%3Bi%3A1%3Bi%3A35751767%3Bi%3A3%3Bi%3A36019810%3Bi%3A1%3B%7D; cookies_policy_accepted=b24gMjAxOS0wNi0xNiAxODoyMDowMSBhY2NlcHRlZA%3D%3D; IE-set_country=RVM%3D; IE-LANG_CODE=ZXNfRVM%3D; G_ENABLED_IDPS=google'
      },
      uri: 'https://www.ivoox.com/login_zl.html',
      body: config.IVOOX_LOGIN
      method: 'POST'
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          resolve(response.headers['set-cookie']);
        } else {
          reject(error);
        }
    });
  });
}

function GetParams(url){
  let q = url.split('?'),result={};
  if(q.length>=2){
      q[1].split('&').forEach((item)=>{
           try {
             result[item.split('=')[0]]=item.split('=')[1];
           } catch (e) {
             result[item.split('=')[0]]='';
           }
      })
  }
  return result;
}

async function getPremiumLink(url){
    try {
            var cookies = await getCookies();
            var prehtml = await request(url, cookies);
            var idx1 = prehtml.indexOf("$('.downloadlink').load('downloadlink_mm_");
            var b = prehtml.substring(idx1, idx1 + 150);
            var idx2 = b.indexOf('downloadlink_mm');
            var c = b.substring(idx2, idx2 + 50);
            var idx3 = c.indexOf("'");
            var newurl = "https://www.ivoox.com/" + c.substring(0, idx3);
            var html = await request(newurl);

            var idx1 = html.indexOf("downloadFollow(event,");
            var urlAndMore = html.substring(idx1 + 22, idx1 + 150);
            var idx2 = urlAndMore.indexOf("'");
            var realUrl = urlAndMore.substring(0, idx2);
            if (realUrl.indexOf("https://www.ivoox.com") == 0){
              return realUrl;
            }
            return null;
        } catch (e) {
        console.log(e);
        return null;
    }
 }

http.createServer(async function (req, res) {
        var params = GetParams(req.url);
        console.log("Request with parameter " + params.p);
        var url = await getPremiumLink('https://www.ivoox.com/' + params.p + '.html');
        console.log("Url to redirect: " + url);
        if (url == null){
                res.writeHead(500, {'Content-Type': 'text/plain'});
        } else {
                res.writeHead(301,
                        {Location: url}
                );
        }
        res.end();
}).listen(9615);

console.log("Server is up!");
