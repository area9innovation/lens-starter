"use strict";

var NodeView = require("../node").View;
var $$ = require("../../../substance/application").$$;


// Substance.RelatedArticles.View
// ==========================================================================

var HTMLTableFooterView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);
};

HTMLTableFooterView.Prototype = function() {
  this.render = function() {
    NodeView.prototype.render.call(this);

    const $footer = $$('.footer', {
      html: "<b>" + this.node.label + "</b> "
    });

    const content = this.createTextPropertyView([this.node.id, 'content']);
    $footer.appendChild(content.render().el);

    this.content.appendChild($footer);
    return this;
  };
};

HTMLTableFooterView.Prototype.prototype = NodeView.prototype;
HTMLTableFooterView.prototype = new HTMLTableFooterView.Prototype();

module.exports = HTMLTableFooterView;
