var LensNodes = require("lens/article/nodes");
var CrossReferenceView = LensNodes["cross_reference"].View;

module.exports = {
  Model: require('./affiliation_reference'),
  View: CrossReferenceView
};
