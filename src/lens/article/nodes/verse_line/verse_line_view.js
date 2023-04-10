"use strict";

var _ = require('underscore');
var CompositeView = require("../composite").View;
var $$ = require ("../../../substance/application").$$;
var ResourceView = require('../../resource_view');
var NodeView = require("../node").View;

// Substance.VerseLine.View
// ==========================================================================

var VerseLineView = function(node, viewFactory, options) {
  CompositeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);
};

VerseLineView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.isZoomable = true;

  // Rendering
  // =============================
  //

  this.render = function() {
    this.options.focus = this.node.referenced;

    NodeView.prototype.render.call(this);

    this.content.appendChild($$('div', {text: this.node.properties.text}))

    return this;
  };
};

VerseLineView.Prototype.prototype = CompositeView.prototype;
VerseLineView.prototype = new VerseLineView.Prototype();

module.exports = VerseLineView;
