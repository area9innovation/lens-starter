window.Lens = require("./src/my-lens");

if (!String.prototype.includes) {
  String.prototype.includes = function() {
    'use strict';
    return String.prototype.indexOf.apply(this, arguments) !== -1;
  };
}

(function (constructor) {
    if (constructor &&
        constructor.prototype &&
        constructor.prototype.children == null) {
        Object.defineProperty(constructor.prototype, 'children', {
            get: function () {
                var i = 0, node, nodes = this.childNodes, children = [];
                //iterate all childNodes
                while (node = nodes[i++]) {
                    //remenber those, that are Node.ELEMENT_NODE (1)
                    if (node.nodeType === 1) { children.push(node); }
                }
                return children;
            }
        });
    }
  //apply the fix to all HTMLElements (window.Element) and to SVG/XML (window.Node)
})(window.Node || window.Element);

if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return k.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return -1.
      return -1;
    }
  });
}

// Little helper used to parse query strings from urls
// --------
//

var qs = function () {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
      // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
      // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
      // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  }
  return query_string;
} ();

// This document gets loaded by default
// --------

//var documentURL = "data/example.xml";
//var documentURL = "data/97_16_1354/97_16_1354.xml";
//var documentURL = "data/5_4_e20/5_4_e20.xml";
//var documentURL = "data/5_4_e19/5_4_e19.xml";
//var documentURL = 'data/97_15_1220/97_15_1220.xml';
var documentURL = 'data/99_1_10/99_1_10.xml';

$(function() {

  // Create a new Lens app instance
  // --------
  //
  // Injects itself into body
  //$('body').append('<div><div id="lens" style="height: 50%; width: 50%; position:absolute; top:30%; left: 35%;"></div></div>');
  //$('body').append('<div><div id="lens" style="height: 100%; width: 100%; position: absolute;"></div></div>');
  //$('body').append('<div id="lens" style="height: 100%; width: 100%;"></div>');

  var manifest;
  var path = documentURL.split('/');
  path[path.length-1] = path[path.length-2] + '(1)/manifest.xml';

  var inFullScreen = false;
  var fullScreenToggler = function() {
    inFullScreen = ! inFullScreen;
    return inFullScreen ? "Window" : "Full screen";
  };

  $.get(path.join('/'))
    .done(function(data) {
      if ($.isXMLDoc(data)) {
        manifest = data;
      }
    })
    .always(function() {
      var app = new window.Lens({
//      el: '#lens',
        document_url: qs.url ? decodeURIComponent(qs.url) : documentURL,
        show_resources_panel: false,
//      show_abstract_only: true,
        bcvideo_account_id: '2324982687001',
        bcvideo_player_id: 'SyhwgKNKl_default',
        manifest: manifest
        full_screen_toggler: fullScreenToggler,
        external_menu_cb: onMenuReady,
        return_url: 'http://devstore2.jbjs.org/login?returnUrl=http%3A%2F%2Ftech.area9innovation.com%2Fjbjs%2Fhub%2Fpages%2Fhome.html',
      });

      app.listenTo(app.controller, 'loaded:xml', onXmlLoaded);
      app.listenTo(app.controller, 'loaded:doc', onDocLoaded);
      app.listenTo(app.controller, 'created:reader', onReaderCreated);
      app.start();

      window.app = app;

      $('#container').css('min-width', '100px');
    });

});

function onXmlLoaded(data) {
  var title = data.querySelector("article-title");
  var q = title?title.textContent:"";
  $.get("https://rsuite.tech.area9innovation.com/search?query="+ q +"&count=2&type=article&sortby=relevancy")
    .done(function(data) {
    });
}

function onDocLoaded(reader, doc, state) {
  if( !state.focussedNode ) return;

  var fs = state.focussedNode.split('video_ref_');

  if ( fs.length === 2 ) {
    for(var i=1; doc.nodes['video_'+i]; ++i) {
      if ( doc.nodes['video_'+i].url === fs[1] ) {
        state.focussedNode = 'video_'+i;
        return;
      }
    }

    state.focussedNode = null;
  }
}

function onMenuReady() {
  $('.resources .menu-bar .external-menu').after('<a class="favorite article" style="float:right; margin:10px 15px; width:20px; height:20px" content_type="article" content_id="1330028"></a>');
}

function onReaderCreated() {
  $('body').append('<a class="favorite article" style="position: absolute; right: 1rem; top: 1rem;"; width:2rem; height:2rem" content_type="article" content_id="1330028"></a>');
}