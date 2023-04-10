"use strict";

var _ = require('underscore');
var CompositeView = require("../../nodes/composite").View;
var ResourceView = require('../../resource_view');
var NodeView = require("../node").View;

var FigureGroupView = function(node, viewFactory, options) {
  CompositeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);
};

FigureGroupView.Prototype = function() {
  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.isZoomable = true;

  this.createElement = function() {
    var el = document.createElement('div');
    return el;
  };

  this.setClasses = function() {
    this.$el.addClass('figure_group');
  };

  this.render = function() {
    this.options.focus = this.node.referenced;

    NodeView.prototype.render.call(this);
    this.renderHeader();
    this.renderChildren({header: this.options.header, zoom: false});
    return this;
  };
};

FigureGroupView.Prototype.prototype = CompositeView.prototype;
FigureGroupView.prototype = new FigureGroupView.Prototype();

module.exports = FigureGroupView;
