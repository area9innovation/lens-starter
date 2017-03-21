"use strict";

var AnnotationView = require('lens/article/nodes/annotation/annotation_view');

var TableFootnoteReferenceView = function(node, viewFactory) {
  AnnotationView.call(this, node, viewFactory);
};

TableFootnoteReferenceView.Prototype = function() {
};

TableFootnoteReferenceView.Prototype.prototype = AnnotationView.prototype;
TableFootnoteReferenceView.prototype = new TableFootnoteReferenceView.Prototype();

module.exports = TableFootnoteReferenceView;
