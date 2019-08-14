"use strict";
var LensNodes = require("lens/article/nodes");
var VideoSummaryModel = LensNodes["video"].Model;

module.exports = {
  Model: VideoSummaryModel,
  View: require('./../video/video_view')
};
