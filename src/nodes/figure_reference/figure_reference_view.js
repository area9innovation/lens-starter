"use strict";

var AnnotationView = require('lens/article/nodes/annotation/annotation_view');

var FigureReferenceView = function(node, viewFactory) {
  AnnotationView.call(this, node, viewFactory);
  this.$el.removeClass('figure_reference').addClass('textual_annotation');
};

FigureReferenceView.Prototype = function() {
};

FigureReferenceView.Prototype.prototype = AnnotationView.prototype;
FigureReferenceView.prototype = new FigureReferenceView.Prototype();

module.exports = FigureReferenceView;
