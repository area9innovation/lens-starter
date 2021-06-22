"use strict";

var _ = require('underscore');
var NodeView = require("lens/article/nodes/node").View;
var $$ = require("lens/substance/application").$$;
var ResourceView = require('lens/article/resource_view');

// Lens.ELetter.View
// ==========================================================================

var ELetterView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);

};

ELetterView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.renderBody = function() {
    var file;

    if( this.node.url ) {
      var urlParams = (new URL(location)).searchParams,
        id = urlParams.get('rsuite_id'),
        topics = urlParams.get('topics');

      topics = topics ? topics.split(/\+/) : [];

      file = $$('div.file', {
        children: [
          $$('span', {html: this.node.getHeader() }),
          $$('a', {
            class: 'jbjs_tracking',
            jbjs_tracking_type: 'download',
            jbjs_tracking_data: JSON.stringify({ id, type: 'eletter', topics }),
            href: this.node.url,
            html: (this.node.icon?'<img src="' + this.node.icon + '"/>':'<i class="fa fa-download"/>') + ' Download',
            target: '_blank',
          })
        ]
      });
    } else {
      file = $$('div.file', {
        children: [
          $$('span', {html: this.node.getHeader() }),
        ]
      });
    }

    this.content.appendChild(file);
  };
};

ELetterView.Prototype.prototype = NodeView.prototype;
ELetterView.prototype = new ELetterView.Prototype();
ELetterView.prototype.constructor = ELetterView;

module.exports = ELetterView;
