var LensNodes = require("lens/article/nodes");
var FootnoteReferenceModel = LensNodes["footnote_reference"].Model;

module.exports = {
  Model: FootnoteReferenceModel,
  View: require('./table_footnote_reference_view.js')
};
