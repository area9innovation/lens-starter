"use strict";

var $$ = require ("lens/substance/application").$$;
var OriginalFigureView = require('lens/article/nodes/figure').View;

var FigureView = function(node, viewFactory, options) {
  OriginalFigureView.apply(this, arguments);
};

FigureView.Prototype = function() {
  this.renderBody = function() {
    dev.trace("render figure custom");
    this.content.appendChild($$('.label', {text: this.node.label}));

    if (this.node.urls.length) {
      this.node.urls.forEach(function(url) {
        // Add graphic (img element)
        var imgEl = $$('.image-wrapper', {
          children: [$$("img", {src: url})]
        });
        this.content.appendChild(imgEl);
      }, this);
    }

    this.renderChildren();

    if (this.node.attrib) {
      this.content.appendChild($$('.figure-attribution', {text: this.node.attrib}));
    }
  };
};

FigureView.Prototype.prototype = OriginalFigureView.prototype;
FigureView.prototype = new FigureView.Prototype();

module.exports = FigureView;
