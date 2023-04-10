"use strict";

var _ = require('underscore');
var NodeView = require("../../nodes/node").View;
var $$ = require("../../../substance/application").$$;
var ResourceView = require('../../resource_view');

// Lens.Supplement.View
// ==========================================================================

var SupplementView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);

};

SupplementView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.renderBody = function() {
    dev.trace("SupplementView - renderBody");

    var file;
    var node = this.node;

    if (!node.url) return;

    if (node.caption) {
      this.content.appendChild($$('.label', { text: node.caption }));
    }

    if (node.url) {
      var urlParams = (new URL(location)).searchParams,
        topics = urlParams.get('topics'),
        id = urlParams.get('rsuite_id');

      urlParams = (new URL(node.url, window.location)).searchParams;

      var type = urlParams.get('type'),
        subtype = urlParams.get('subtype');

      topics = topics ? topics.split(/\+/) : [];

      switch (type) {
        case 'supplement': break;
        case 'pdf':
        case 'zip': type = subtype === 'disclosure' ? subtype : 'article'; break;
        default: type = 'unknown';
      }

      file = $$('div.file', {
        children: [
          $$('span', { html: node.getHeader() }),
          $$('a', {
            class: 'jbjs_tracking',
            jbjs_tracking_type: 'download',
            jbjs_tracking_data: JSON.stringify({ id, type, topics }),
            href: node.url,
            html: (node.icon?'<img src="' + node.icon + '"/>':'<i class="fa fa-download"/>') + ' Download',
            target: '_blank',
          })
        ]
      });
    } else {
      file = $$('div.file', {
        children: [
          $$('span', {html: node.getHeader() }),
        ]
      });
    }

    this.content.appendChild(file);
  };
};

SupplementView.Prototype.prototype = NodeView.prototype;
SupplementView.prototype = new SupplementView.Prototype();
SupplementView.prototype.constructor = SupplementView;

module.exports = SupplementView;
