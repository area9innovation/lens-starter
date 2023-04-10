"use strict";

var _ = require("underscore");
var NodeView = require("../node").View;
var $$ = require("../../../substance/application").$$;
var ResourceView = require('../../resource_view');

// Substance.Paragraph.View
// ==========================================================================

var HTMLTableView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);

};

HTMLTableView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.isZoomable = true;

  this.renderBody = function() {

    // Display caption
    //
    if (this.node.caption) {
      var captionView = this.createView(this.node.caption);
      this.content.appendChild(captionView.render().el);
    }


    // The actual content
    // --------
    //
    this.ATPos = 0;

    var child;
    var twClass;

    if( this.node.table ) {
      child = this.buildTable(this.node.table);
      twClass = '.table-wrapper';
    } else if( this.node.image ) {
      child = $$('img', { src: this.node.image});
      twClass = '.image-wrapper';
    }

    if( child ) {
      var tableWrapper = $$(twClass, {
          children: [ child ],
        }
      );

      this.content.appendChild(tableWrapper);
    }

    // Display footers (optional)
    // --------
    //

    var footers = $$('.footers', {
      children: _.map(this.node.footers, function(footer) {
        return $$('.footer', { html: "<b>"+footer.label+"</b> " + footer.content });
      })
    });

    this.content.appendChild(footers);
  };

  this.buildTable = function(obj) {
    var el = document.createElement(obj.name);

    _.each(obj.attributes, function(a) {
      el.setAttribute(a.name, a.value);
    });

    var this_ = this;
    if ( obj.childrens ) {
      obj.childrens.forEach(function(children){
        el.appendChild(this_.buildTable(children));  
      });
    } else {
      var annoView = this.createTextPropertyView([this.node.id, 'annotated_text', this.ATPos]);
      el.appendChild(annoView.render().el);

      ++this.ATPos;
    }
    return el;
  };
};

HTMLTableView.Prototype.prototype = NodeView.prototype;
HTMLTableView.prototype = new HTMLTableView.Prototype();

module.exports = HTMLTableView;
