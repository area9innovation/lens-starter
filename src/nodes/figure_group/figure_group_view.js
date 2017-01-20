"use strict";

var CompositeView = require("lens/article/nodes/composite").View;

var FigureGroupView = function(node, viewFactory, options) {
  CompositeView.call(this, node, viewFactory);
};

FigureGroupView.Prototype = function() {
  this.createElement = function() {
    var el = document.createElement('div');
    return el;
  };

  this.setClasses = function() {
    this.$el.addClass('figure_group');
  };

};

FigureGroupView.Prototype.prototype = CompositeView.prototype;
FigureGroupView.prototype = new FigureGroupView.Prototype();

module.exports = FigureGroupView;
