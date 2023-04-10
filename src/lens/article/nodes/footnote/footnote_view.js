"use strict";

var CompositeView = require("../composite/composite_view");
var $$ = require("../../../../lens/substance/application").$$;

// Substance.Image.View
// ==========================================================================

var FootnoteView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

FootnoteView.Prototype = function() {
  this.labeledNoteTags = [
    'author-note',
    'article-note'
  ];
  this.render = function() {
    CompositeView.prototype.render.call(this);
    var tag = this.node.properties.tag;
    if (this.labeledNoteTags.includes(tag)) {
      this.$el.context.classList.add(tag);
      this.content.classList.add(tag);
      var header = $$('span.label', {text: this.node.label});
      $(this.content.children).wrapAll('<span class="note"></span>');
      this.content.insertBefore(header, this.content.firstChild);
    }
    return this;
  };

};

FootnoteView.Prototype.prototype = CompositeView.prototype;
FootnoteView.prototype = new FootnoteView.Prototype();

module.exports = FootnoteView;
