"use strict";
var LensNodes = require("lens/article/nodes");
var CitationModel = LensNodes["citation"].Model;


module.exports = {
  Model: CitationModel,
  View: require('./citation_view')
};
