var documentURL = "data/" +
//"authorship_notes/2020412.xml"
//"example/inline_graphic.xml"
//"101_4_338/JBJS.18.00483.xml"
//"101_1_48/JBJS.18.00531_datasharing.xml"
//"1996476/1996476.xml"
//"links_in_refs/Predatory Publishing in Orthopaedic Research.xml"
//"links_in_refs/Influence of Acetabular Coverage on Hip Survival After Free Vascularized Fibular Grafting for Femoral Head Osteonecrosis.xml"
//"99_1_10/99_1_10.xml"
"mathml/JBJSOA-D-17-00063.xml"
//"example.xml"
//"97_16_1354/97_16_1354.xml"
//"5_4_e20/5_4_e20.xml"
//"5_4_e19/5_4_e19.xml"
//'97_15_1220/97_15_1220.xml'
//'99_1_10/99_1_10.xml'
;


var mmobile = window.location.href.match(/mobile/);
var mobileMode = mmobile!=null;


var modeThreshold = 980;

getValidWidth = function() {
  var windowOuterWidth = window.outerWidth>0?window.outerWidth:window.innerWidth;
  var screenWidth = window.screen.width;

  if ( /iPhone/.test(navigator.appVersion) || /iPad/.test(navigator.appVersion) ) {
    var landscape = false;
    if ( window.orientation ) {
      landscape = Math.abs(window.orientation) === 90;
    }
    else if ( window.screen.orientation ) {
      landscape = [90, 270].indexOf(window.screen.orientation.angle) > -1;
    }

    if ( landscape ) {
        if (screenWidth < window.screen.height) screenWidth = window.screen.height;
    } else {
        if (screenWidth > window.screen.height) screenWidth = window.screen.height;
      }
  }

  return Math.min(windowOuterWidth, window.innerWidth, screenWidth);
};


selectMode = function() {
  if ( !mobileMode && getValidWidth() < 980 ) {
    window.location = window.origin + "?mobile";
  }

  if ( mobileMode && getValidWidth() >= 980 ) {
    window.location = window.location.href.replace("?mobile", "");
  }
};

selectMode();

window.onresize = selectMode;
window.onorientationchange = selectMode;

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

var isPIP = false;

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
        show_resources_panel: !mobileMode,
//      show_abstract_only: true,
        bcvideo_account_id: '2324982687001',
        bcvideo_player_id: 'SyhwgKNKl_default',
        manifest: manifest,
        full_screen_toggler: fullScreenToggler,
        external_menu_cb: onMenuReady,
        return_url: 'http://devstore2.jbjs.org/login?returnUrl=http%3A%2F%2Ftech.area9innovation.com%2Fjbjs%2Fhub%2Fpages%2Fhome.html',
        show_disclosure_href: true,
        show_datasharing_href: true
      });

      app.listenTo(app.controller, 'loaded:xml', onXmlLoaded);
      app.listenTo(app.controller, 'loaded:doc', onDocLoaded);
      if(!app.config.show_resources_panel) app.listenTo(app.controller, 'created:reader', onReaderCreated);
      app.start();

      window.app = app;

      $('#container').css('min-width', '100px');
    });

});

function onXmlLoaded(data) {
  var volume = data.querySelector("article-meta volume");
  if( volume ) {
    isPIP = volume.textContent=='Publish Ahead of Print';
  }

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
    return;
  }

  fs = state.focussedNode.split('figure_ref_');

  if ( fs.length === 2 ) {
    for(var i=1; doc.nodes['figure_'+i]; ++i) {
      if ( doc.nodes['figure_'+i].url.includes(fs[1]) ) {
        state.focussedNode = 'figure_'+i;
        return;
      }
    }

    state.focussedNode = null;
    return;
  }
}

function onMenuReady() {
  $('.resources .menu-bar .external-menu').after('<a class="favorite article" style="float:right; margin:10px 15px; width:20px; height:20px" content_type="article" content_id="1330028"></a>');

  $('.resources .menu-bar .external-menu').after('<a class="socialshare article" style="float:right; margin:10px 15px 10px -5px; width:20px; height:20px; cursor: pointer;"><img style="width: 20px" src="https://tech.area9innovation.com/jbjs/hub/pages/images/share_icon.png"></a>');

  $('img.orcid').attr('src', 'https://tech.area9innovation.com/jbjs/hub/pages/images/orcid_logo.png');

  if( isPIP ) {
    $('.surface.resource-view.content').prepend('<div style="font-weight:bold;color:blue;position:fixed;z-index:1; width:45%;padding-left:50px;"><center>Abstract and PDF now available.</center><center>Full text HTML will be available upon publication in the next journal issue</center></div>');
    pipContentCorrection();
  }

//  $('.pubmed').css('display', 'none');
//  $('.googlescholar').css('display', 'none');
}

function onReaderCreated() {
  $('body').append('<a class="favorite article" style="position: absolute; right: 4rem; top: 1rem; width:2rem; height:2rem; margin:0" content_type="article" content_id="1330028"></a>');

  $('body').append('<a class="socialshare saveposition article" style="position: absolute; right: 1rem; top: 1rem; width:2rem; height:2rem; margin:0; cursor: pointer;"><img style="width: 2rem;" src="https://tech.area9innovation.com/jbjs/hub/pages/images/share_icon.png"></a>');

  $('a:contains("Please register or login to see full text of this article")').parent().css('padding-right','4.5rem');

  if( isPIP ) {
    $('.surface.resource-view.content').prepend('<div class="saveposition" style="font-weight:bold;color:blue;position:fixed; left:35px;right:0;z-index:1;"><center>Abstract and PDF now available.</center><center>Full text HTML will be available upon publication in the next journal issue</center></div>');
    pipContentCorrection();
  }
}

function pipContentCorrection() {
  var node = $('.surface.resource-view.content .nodes .content-node')[0];

  if( $(node).hasClass('cover') ) {
    $( node ).css('padding-top', '55px');
  } else if( $(node).hasClass('text') ) {
    $( node ).css('padding-top', '80px');
  }
}
