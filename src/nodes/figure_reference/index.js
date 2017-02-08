var LensNodes = require("lens/article/nodes");
var FigureReferenceModel = LensNodes["figure_reference"].Model;

module.exports = {
  Model: FigureReferenceModel,
  View: require('./figure_reference_view.js')
};
