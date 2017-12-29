var webPage = require('webpage');
var page = webPage.create();
page.settings.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.71 Safari/537.36';
page.onResourceRequested = function(requestData, networkRequest) {
  var match = requestData.url.match(/(addevweb|google|facebook|\.css)/g);
  var isJquery = false;//requestData.url.indexOf("jquery") > -1;
  if (match != null && !isJquery) {
    //console.log("X",requestData.url);
    networkRequest.abort();
  }
};
var fs = require('fs');
var podcasts = require('./podcasts.json');

console.log(podcasts.length + " podcasts found.");

function getFeed(podcast, data){
  page.onError = function(msg, trace){
    //console.log("Error => ", msg);
    var allowedErrors = ["TypeError"];    
    for (var i = 0; i < allowedErrors.length; i++){
      if (msg.indexOf(allowedErrors[i]) > -1){
        currentOpen("success");
	currentOpen = function(){};
	return true;
      }
    }
    //console.log("Exiting!!", JSON.stringify(trace)); 
    //phantom.exit();
    currentOpen("success");
    currentOpen = function(){};
  };
  page.onConsoleMessage = function (msg) { console.log(msg); };
  //console.log("Opening page...", podcast.url);
  page.open(podcast.url, onOpen);
  var onOpen = function(status) {
    if (status === "success") {
      //console.log("Page opened");
      var jqL = page.injectJs("jquery.min.js");
      var result = page.injectJs('get-feed.js');
      var result2 = page.injectJs('moment.min.js');
      //console.log(jqL, result, result2);
      if (result && result2) {
        page.onCallback = function(data) {
          if (data.log){
            console.log("\t" + data.log);
          } else {
            if (data.added > 0){
              var xml = page.content.replace(/^.*?<body.*?>/g, "").replace(/<\/body><\/html>.*?$/g, "");
              fs.write(podcast.outputFile, xml, 'w');
            }
            console.log("Done (added " + data.added + ")!");
            doDownload();
          }
        };
	//console.log("Starting evaluate...");
        page.evaluate(function(xml){
	  try {
	    //console.log("Getting feed...", jQuery, $);
            GetFeed(xml);
	  } catch(e){
	    console.log("An error occurred when getting feed!", e);
	  }
        }, data);
      } else {
        console.log("An error occurred!");
        doDownload();
      }
    } else {
        console.log("???", status);
        doDownload();
    }
  };
  var currentOpen = onOpen;
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
