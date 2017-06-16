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
      });

      app.start();

      window.app = app;

      $('#container').css('min-width', '100px');
    });

});
