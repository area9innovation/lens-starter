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
    var byId = node['url_webm'] && node['url_webm'].indexOf('By Id') !== -1;
    var playlist = node['url_ogv'] && node['url_ogv'].indexOf('Playlist') !== -1;

    var video =  $$('video', {
      'data-application-id': '',
      'data-id': node.url,
      'class': 'video-js',
      style: 'width: 100%; height: 100%; position: absolute; top: 0px; bottom: 0px; right: 0px; left: 0px;',
      controls: '',
    });
    $(video).attr(playlist?'data-playlist-id':'data-video-id', (!byId ? 'ref:' : '') + node.url);

    var video = $$('.video-wrapper', {
      children: [
        $$('div', {
          style: 'display: block; position: relative; max-width: 100%;',
          children: [
            $$('div', {
              style: 'padding-top: 50%; position: relative;',
              children: [
                video
              ]
            }),
            $$('div', {
              'class': 'vjs-playlist',
              style: 'overflow: auto',
            })
          ]
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
