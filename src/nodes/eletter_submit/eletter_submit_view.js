"use strict";

var _ = require('underscore');
var NodeView = require("lens/article/nodes/node").View;
var $$ = require("lens/substance/application").$$;
var ResourceView = require('lens/article/resource_view');

// Lens.ELetterSubmit.View
// ==========================================================================

var ELetterSubmitView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);

};

ELetterSubmitView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.renderBody = function() {
    var node = this.node;

    if (!node.url) return;
  
    if (node.caption) {
      this.content.appendChild($$('.label', { text: node.caption }));
    }

    this.content.appendChild($$('.link', {
      children: [
        $$('a', {
          href: node.url,
          target: '_blank',
          children: [
            $$('img', { class: 'image', src: node.image }),
            $$('span', { class: 'label', html: node.getHeader() })
          ]
        })
      ]
    }));
  };
};

ELetterSubmitView.Prototype.prototype = NodeView.prototype;
ELetterSubmitView.prototype = new ELetterSubmitView.Prototype();
ELetterSubmitView.prototype.constructor = ELetterSubmitView;

module.exports = ELetterSubmitView;
