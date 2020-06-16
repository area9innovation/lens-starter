"use strict";
var LensNodes = require("lens/article/nodes");
var AuthorInsightsModel = LensNodes["video"].Model;

module.exports = {
  Model: AuthorInsightsModel,
  View: require('./../video/video_view')
};
