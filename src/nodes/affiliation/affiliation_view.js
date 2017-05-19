"use strict";

var _ = require("underscore");
var NodeView = require("lens/article/nodes/node").View;
var $$ = require("lens/substance/application").$$;

var AffiliationView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);
};

AffiliationView.Prototype = function() {
  this.render = function() {
    NodeView.prototype.render.call(this);

    if ( this.node.relaxed_text ) {
	    var header = $$('span.label', {text: this.node.label});
	    this.content.appendChild(header);

    	var annoView = this.createTextPropertyView([this.node.id, 'relaxed_text']);
    	this.content.appendChild(annoView.render().el);
	}

    return this;
  };

};

AffiliationView.Prototype.prototype = NodeView.prototype;
AffiliationView.prototype = new AffiliationView.Prototype();

module.exports = AffiliationView;
