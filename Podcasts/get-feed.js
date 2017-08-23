var PAUSE = 1000;
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}
function createElement(docu, name, attributes, text, isCData){
  var elem = docu.createElement(name);
  if (attributes){
    for (var i = 0; i < attributes.length; i++){
      elem.setAttribute(attributes[i].name, attributes[i].value);
    }
  }
  if (text){
    if (isCData){
      elem.appendChild(docu.createCDATASection(text));
    } else {
      elem.appendChild(docu.createTextNode(text));
    }
  }
  return elem;
}
var docu = new DOMParser().parseFromString('<channel></channel>',  "application/xml");
function GetFeed(currentXML){
    var lastGuid = null;
    var xml = null;
    if (currentXML){
      xml = $.parseXML(currentXML);
      lastGuid = xml.getElementsByTagName("item")[0].getElementsByTagName("guid")[0].firstChild.nodeValue;
      window.callPhantom({log: "lastguid is " + lastGuid});
    }
    var shareBtnSelector = ".zone-tools > a:first";
    var substract = 5000;
    var getItems = function(url, $) {
        if (!xml && url.endsWith('_1.html')) return false;
        window.callPhantom({log: "working on " + url});
        var items = $('.title-wrapper.text-ellipsis-multiple > a');
        for (var i = 0; i < items.length; i++) {
            var a = items[i];
            var duration = $(a).parent().next('.time').first().html();
            var link = a.href;
            var enclosure = link.replace('-audios-mp3_rf', '_mf').replace('_1.html', '_feed_1.mp3');
            var title = a.title;
            var $button = $(a).next('button');
            var description = $button.attr('data-content');
            var guid = 'http://www.ivoox.com/' + link.replace(/^.*?_([0-9]+)_1\.html$/g, '$1');
            if (lastGuid && guid === lastGuid){
              return true;
            }
            var item = createElement(docu, "item");
            item.appendChild(createElement(docu, "title", [], title, true));
            item.appendChild(createElement(docu, "link", [], link));
            item.appendChild(createElement(docu, "enclosure", [
              { name: 'url', value: enclosure },
              { name: 'type', value: "audio/mpeg" },
              { name: 'length', value: "999999" }
            ]));
            item.appendChild(createElement(docu, "description", [], description, true));
            item.appendChild(createElement(docu, "guid", [], guid));
            item.appendChild(createElement(docu, "pubDate", [], moment().subtract(substract++, 'days').format('dd, DD MMM YYYY HH:mm:ss')));
            item.appendChild(createElement(docu, "itunes:duration", [], duration));
            docu.getElementsByTagName('channel')[0].appendChild(item);
            window.callPhantom({log: "added item with guid " + guid});
        }
        return false;
    };
    var finishProcess = function(data, prepend){
      document.head.innerHTML = "";
      document.body.innerHTML = "";
      document.write = data.documentElement
      document.body.appendChild(data.documentElement);
      if (!prepend){
        var currentTitle = $(document.body).find('title:first').text();
        $(document.body).find('title:first').text('#: ' + currentTitle);
      }
      var channel = $(document.body).find('channel')[0];
      var items = docu.getElementsByTagName('channel')[0].childNodes;
      try {
        if (prepend){
          var firstItem = $(document.body).find('item')[0];
          for (i = 0; i < items.length; i++) {
            channel.insertBefore(items[i], firstItem);
          }
        } else {
          for (i = 0; i < items.length; i++) {
            channel.appendChild(items[i]);
          }
        }
      } catch(ex){
            window.callPhantom({log: ex.toString()});
      }
      window.callPhantom({xml: data, added: items.length});
    };
    var getXML = function() {
        if (xml){
          finishProcess(xml, true);
        } else {
          var xmlURL = $('#suscription li:first input').length > 0 ? $('#suscription li:first input')[0].value : location.href.replace('_sq_', '_fg_').replace('_1.html', '_filtro_1.xml');
          $.get(xmlURL, function(data){
            finishProcess(data, false);
          });
        }
    };
    var script = document.createElement('script');
    script.type = "text/javascript";
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment.min.js';
    script.onload = function() {
        window.xmlItems = [];
        $(shareBtnSelector).click();
        var iframe = document.createElement('iframe');
        iframe.onload = function() {
            setTimeout(function() {
                var breakProcess = getItems(iframe.src, iframe.contentWindow.jQuery);
                var next = breakProcess ? [] : iframe.contentWindow.jQuery("[aria-label='Siguiente']");
                if (next.length > 0 && next[0].href.indexOf('#') === -1) {
                    //window.callPhantom({log: 'new url => ' + next[0].href});
                    iframe.src = next[0].href;
                } else {
                    try {
                        getXML();
                    } catch (e) {
                        //window.callPhantom({log: window.xmlItems.join('')});
                    }
                }
            }, PAUSE);
        };
        iframe.style.display = 'none';
        iframe.src = location.href;
        iframe.id = 'ivoox-iframe';
        document.body.appendChild(iframe);
    };
    document.body.appendChild(script);
};
