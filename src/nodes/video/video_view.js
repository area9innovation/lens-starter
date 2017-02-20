"use strict";

var _ = require("underscore");
var $$ = require("lens/substance/application").$$;
var NodeView = require("lens/article/nodes/node").View;
var ResourceView = require('lens/article/resource_view');

var VideoView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  ResourceView.call(this, options);
};

VideoView.Prototype = function() {

  _.extend(this, ResourceView.prototype);

  this.isZoomable = false;

  this.renderBody = function() {
    var node = this.node;

    var video = $$('.video-wrapper', {
      children: [
        $$('iframe', {
          'data-id': node.url,
          allowfullscreen: '',
          webkitallowfullscreen: '',
          mozallowfullscreen: '',
          style: 'width:640px;height:360px;',
        })
      ]
    });

    this.content.appendChild(video);

    if (node.title) {
      this.content.appendChild($$('.title', {
        text: node.title
      }));
    }

    if (this.node.caption) {
      var caption = this.createView(this.node.caption);
      this.content.appendChild(caption.render().el);
      this.captionView = caption;
    }
  };

};

VideoView.Prototype.prototype = NodeView.prototype;
VideoView.prototype = new VideoView.Prototype();

module.exports = VideoView;
