"use strict";
var LensNodes = require("lens/article/nodes");
var VideoModel = LensNodes["video"].Model;

module.exports = {
  Model: VideoModel,
  View: require('./video_view')
};
