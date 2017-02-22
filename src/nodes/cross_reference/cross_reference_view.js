"use strict";

var AnnotationView = require('lens/article/nodes/annotation/annotation_view');

var CrossReferenceView = function(node, viewFactory) {
  AnnotationView.call(this, node, viewFactory);
  this.$el.removeClass('cross_reference').addClass('textual_annotation');
};

CrossReferenceView.Prototype = function() {
};
CrossReferenceView.Prototype.prototype = AnnotationView.prototype;
CrossReferenceView.prototype = new CrossReferenceView.Prototype();

module.exports = CrossReferenceView;
