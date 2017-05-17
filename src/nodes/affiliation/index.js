"use strict";
var LensNodes = require("lens/article/nodes");
var AffiliationModel = LensNodes["affiliation"].Model;

module.exports = {
  Model: AffiliationModel,
  View: require('./affiliation_view')
};
