"use strict";

var CitationView = require('lens/article/nodes/citation').View;

var InlineCitationView = function(node, viewFactory, options) {
  CitationView.apply(this, arguments);
};


InlineCitationView.Prototype = function() {
  this.renderBody = function() {
    this.constructor.Prototype.prototype.renderBody.call(this);
    $(this.content).prepend(this.node.properties.label+'&nbsp;');
  };
};

InlineCitationView.Prototype.prototype = CitationView.prototype;
InlineCitationView.prototype = new InlineCitationView.Prototype();
InlineCitationView.prototype.constructor = InlineCitationView;

module.exports = InlineCitationView;
