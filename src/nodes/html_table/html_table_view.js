"use strict";

var HTMLTableView = require('lens/article/nodes/html_table').View;

var InlineHTMLTableView = function(node, viewFactory, options) {
	HTMLTableView.apply(this, arguments);
};

InlineHTMLTableView.Prototype = function() {

  this.renderBody = function() {
    this.constructor.Prototype.prototype.renderBody.call(this);
    $(this.content).find('.content-node.caption .text .content').prepend('<span class="table-caption-label">' + this.node.label + '</span>');
  };
};

InlineHTMLTableView.Prototype.prototype = HTMLTableView.prototype;
InlineHTMLTableView.prototype = new InlineHTMLTableView.Prototype();
InlineHTMLTableView.prototype.constructor = InlineHTMLTableView;

module.exports = InlineHTMLTableView;
