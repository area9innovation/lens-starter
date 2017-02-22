var LensNodes = require("lens/article/nodes");
var CrossReferenceModel = LensNodes["cross_reference"].Model;

module.exports = {
  Model: CrossReferenceModel,
  View: require('./cross_reference_view.js')
};
