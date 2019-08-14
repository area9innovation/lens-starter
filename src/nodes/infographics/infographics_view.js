"use strict";

var _ = require('underscore');
var $$ = require ("lens/substance/application").$$;
var ResourceView = require('lens/article/resource_view');
var NodeView = require("lens/article/nodes/node").View;

// Substance.Infographics.View
// ==========================================================================

var InfographicsView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);
};

InfographicsView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.isZoomable = true;

  // Rendering
  // =============================
  //

  this.renderBody = function() {
    var node = this.node;

    this.content.appendChild($$('.label', { text: node.label }));

    if (node.url) {
      var el = $$('.infographics-wrapper', {
        children: [
          $$("object", {
            data: node.url,
            type: "application/pdf",
            width: "100%",
            height: "100%"
          })
        ]
      });
      this.content.appendChild(el);
    }
  };
};

InfographicsView.Prototype.prototype = NodeView.prototype;
InfographicsView.prototype = new InfographicsView.Prototype();

module.exports = InfographicsView;
