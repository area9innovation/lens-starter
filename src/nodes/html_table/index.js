"use strict";
var LensNodes = require("lens/article/nodes");
var HtmlTableModel = LensNodes["html_table"].Model;

module.exports = {
  Model: HtmlTableModel,
  View: require('./html_table_view')
};
