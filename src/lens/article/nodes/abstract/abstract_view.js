"use strict";

var _ = require("underscore");
var NodeView = require("../node").View;
var $$ = require("../../../substance/application").$$;
var articleUtil = require("../../article_util");

// Lens.Cover.View
// ==========================================================================

var AbstractView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);
};

AbstractView.Prototype = function() {

  // Render it
  // --------

  this.render = function() {
    dev.trace("AbstractView - render");
    NodeView.prototype.render.call(this);

    var node = this.node;

    var sections = $$('.sections', {
      children: _.map(node.getSections(), function(contentPara) {
        var paraView = this.viewFactory.createView(contentPara);
        var paraEl = paraView.render().el;
        this.content.appendChild(paraEl);
        return paraEl;
      }, this)
    });

    this.content.appendChild(sections);
    return this;
  };
};

AbstractView.Prototype.prototype = NodeView.prototype;
AbstractView.prototype = new AbstractView.Prototype();

module.exports = AbstractView;
