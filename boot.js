window.Lens = require("./src/my-lens");

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
var documentURL = "data/97_16_1354/97_16_1354.xml";
//var documentURL = "data/5_4_e20/5_4_e20.xml";

$(function() {

  // Create a new Lens app instance
  // --------
  //
  // Injects itself into body

  var app = new window.Lens({
    document_url: qs.url ? decodeURIComponent(qs.url) : documentURL,
    show_resources_panel: false
  });

  app.start();

  window.app = app;

});