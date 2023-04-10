"use strict";

var _ = require('underscore');
var CompositeView = require("../../nodes/composite").View;
var ResourceView = require('../../resource_view');
var NodeView = require("../node").View;

var VerseGroupView = function(node, viewFactory, options) {
  CompositeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);
};

VerseGroupView.Prototype = function() {
  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.isZoomable = true;

  this.createElement = function() {
    var el = document.createElement('div');
    return el;
  };

  this.setClasses = function() {
    this.$el.addClass('verse_group');
  };

  this.render = function() {
    NodeView.prototype.render.call(this);

    this.renderChildren();

    return this;
  };
};

VerseGroupView.Prototype.prototype = CompositeView.prototype;
VerseGroupView.prototype = new VerseGroupView.Prototype();

module.exports = VerseGroupView;
