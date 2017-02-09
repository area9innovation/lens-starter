"use strict";

var HTMLTableView = require('lens/article/nodes/html_table').View;

var InlineHTMLTableView = function(node, viewFactory, options) {
	HTMLTableView.apply(this, arguments);
};

InlineHTMLTableView.Prototype = function() {

  this.renderBody = function() {
    this.constructor.Prototype.prototype.renderBody.call(this);
    $(this.content).find('table').prepend('<caption>' + this.node.label + '</caption>');
  };
};

InlineHTMLTableView.Prototype.prototype = HTMLTableView.prototype;
InlineHTMLTableView.prototype = new InlineHTMLTableView.Prototype();
InlineHTMLTableView.prototype.constructor = InlineHTMLTableView;

module.exports = InlineHTMLTableView;
