const http = require('http');
const _request = require('request');
const https = require('https');

function request(url) {
  return new Promise(function (resolve, reject) {
    _request(url, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        resolve(body);
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
	    var prehtml = await request(url);
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