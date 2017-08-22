var webPage = require('webpage');
var page = webPage.create();
var fs = require('fs');
var podcasts = require('./podcasts.json');

console.log(podcasts.length + " podcasts found.");

function getFeed(podcast, data){
  page.open(podcast.url, function(status) {
    if (status === "success") {
      var result = page.injectJs('get-feed.js');
      if (result) {
        page.onCallback = function(data) {
          if (data.log){
            console.log(data.log);
          } else {
            var xml = page.content.replace(/^.*?<body.*?>/g, "").replace(/<\/body><\/html>.*?$/g, "");
            fs.write(podcast.outputFile, xml, 'w');
            console.log("Done!");
            doDownload();
          }
        };
        page.evaluate(function(xml){
          console.log(xml);
          GetFeed(xml);
        }, data);
      } else {
        console.log("An error occurred!");
        doDownload();
      }
    } else {
        doDownload();
    }
  });
}

function doDownload(){
  if (podcasts.length > 0){
    var podcast = podcasts.pop();
    console.log("Starting " + podcast.outputFile + "...");
    var data = null;
    if (fs.exists(podcast.outputFile)){
      data = fs.read(podcast.outputFile);
    }
    getFeed(podcast, data);
  } else {
    phantom.exit();
  }
}

doDownload();
