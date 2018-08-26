const fs = require('fs');
const _request = require('request');
const cheerio = require('cheerio');
const moment = require('moment');
const libxmljs = require('libxmljs');
const { promisify } = require('util')
const podcasts = require('../podcasts.json');
const months = {
  "ene": "01",
  "feb": "02",
  "mar": "03",
  "abr": "04",
  "may": "05",
  "jun": "06",
  "jul": "07",
  "ago": "08",
  "sep": "09",
  "oct": "10",
  "nov": "11",
  "dic": "12"
};

const readfile = promisify(fs.readFile);

function isValidSyntaxStructure(text) {
    try {
        libxmljs.parseXml(text);
    } catch (e) {
        return false;
    }

    return true;
}

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

async function getPremiumLink(url){
    try {
    var prehtml = await request(url);
    var idx1 = prehtml.indexOf("$('.downloadlink').load('downloadlink_mm_");
//console.log("idx1: " + idx1);
    var b = prehtml.substring(idx1, idx1 + 150);
    var idx2 = b.indexOf('downloadlink_mm');
//console.log("idx2: " + idx2);
    var c = b.substring(idx2, idx2 + 50);
    var idx3 = c.indexOf("'");
//console.log("idx3: " + idx3);
    var newurl = "https://www.ivoox.com/" + c.substring(0, idx3);
    var html = await request(newurl);

    var idx1 = html.indexOf("downloadFollow(event,");
//console.log("idx1: " + idx1);
    var urlAndMore = html.substring(idx1 + 22, idx1 + 150);
    var idx2 = urlAndMore.indexOf("'");
//console.log("idx2: " + idx2 + " (" + urlAndMore + ")");
    var realUrl = urlAndMore.substring(0, idx2);
//    console.log("URL => " + realUrl);
    if (realUrl.indexOf("https://www.ivoox.com") == 0)
      return realUrl;
    return null;
  } catch (e) {
    console.log(e);
        return null;
    } 
 }

async function DoUpdateFeed(url, file){
	// Read file
	var data = await readfile("../" + file);
	var $file = cheerio.load(data.toString());
  	var firstItem = $file("item").first();
  	var lastGuid = firstItem.find("guid").text() || false;
  	console.log("Last guid for " + url + " is => " + lastGuid);

  	var html = await request(url);
    var $ = cheerio.load(html);

    var itemsImported = [];
    var podcastElems = $(".title-wrapper.text-ellipsis-multiple > a");
    for (var i = 0; i < podcastElems.length; i++){
    //$(".title-wrapper.text-ellipsis-multiple > a").each(function (i, elem) {
    	  //var a = $(this);
        var a = $(podcastElems[i]);
        var duration = $(a).parent().next('.time').first().html();
        var link = a.attr("href");
        var enclosure = link.replace('-audios-mp3_rf', '_mf').replace('_1.html', '_feed_1.mp3');
        var title = a.attr("title");
        var apoyo = a.parents(".content").next(".footer-modulo").find(".play.fan-sus").length > 0;
        if (apoyo){
          var prem_enclosure = await getPremiumLink(a.attr("href"));
          console.log("   Is premium link! (" + prem_enclosure + ")");
          enclosure = prem_enclosure != null ? prem_enclosure : enclosure;
          title = '(APOYAR) ' + title;
        }
        var $button = $(a).next('button');
        var description = $button.attr('data-content');
        var guid = 'https://www.ivoox.com/' + link.replace(/^.*?_([0-9]+)_1\.html$/g, '$1') + '_v2';
        var oldGuidFormat = 'http://www.ivoox.com/' + link.replace(/^.*?_([0-9]+)_1\.html$/g, '$1');
        console.log("   Podcast with title: " + title + " (guid " + guid + ")");
        if (lastGuid && (guid == lastGuid || oldGuidFormat == lastGuid)){
          //return false;
          break;
        }
        var pubDate = $(a).parent().nextAll('.action').find('.date').attr("title")
                          .replace(/^([0-9]+):([0-9]+) - ([0-9]+) de ([a-z]+)\. de ([0-9]+)/g, "$1;$2;$3;$4;$5").split(";");
        var dateTokens = {
          hour: pubDate[0],
          minutes: pubDate[1],
          day: pubDate[2],
          month: months[pubDate[3]],
          year: pubDate[4]
        };
        var pubDate = dateTokens.year + "-" + dateTokens.month + "-" + dateTokens.day + " " + dateTokens.hour + ":" + dateTokens.minutes;
        itemsImported.push({
        	"title": title,
        	"link": link,
        	"enclosure": [
        		{ name: 'url', value: enclosure },
	            { name: 'type', value: "audio/mpeg" },
	            { name: 'length', value: "999999" }
        	],
        	"description": description,
        	"guid": guid,
        	"pubDate": moment(pubDate).format('dd, DD MMM YYYY HH:mm:ss'),
        	"itunes:duration": duration
        });
	//});
  }
    console.log("Imported items: " + itemsImported.length);
    if (itemsImported.length > 0){
      var text = '';
    	for (var i = 0; i < itemsImported.length; i++){
    		text += '<item>' + 
					'<title><![CDATA[' + itemsImported[i].title + ']]></title>' + 
					'<link>' + itemsImported[i].link + '</link>' + 
					'<enclosure url="' + itemsImported[i].enclosure[0].value + '" type="audio/mpeg" length="999999" />' + 
					'<description><![CDATA[' + itemsImported[i].description + ']]></description>' + 
					'<guid>' + itemsImported[i].guid + '</guid>' + 
					'<pubDate>' + itemsImported[i].pubDate + '</pubDate>' + 
					'<itunes:duration>' + itemsImported[i]["itunes:duration"] + '</itunes:duration>' + 
				'</item>';
    	}
    	var result = data.toString().replace('<item>', text + '<item>');

    	if (isValidSyntaxStructure(result)){
		  	fs.writeFile('../' + file, result, 'utf8', function (err) {
		     	if (err) return console.log(err);
		     	else console.log('File successfully written! - Check your project directory for the ' + file + ' file');
		  	});
	  	} else {
	  		console.err("Invalid xml!!!");
	  	}
	}
}

async function UpdateFeed(){
	for (var i = 0; i < podcasts.length; i++){
		var url = podcasts[i].url;
		var file = podcasts[i].outputFile;
		if (fs.existsSync("../" + file)) {
		  	await DoUpdateFeed(url, file);
		}
	}
}

UpdateFeed();


