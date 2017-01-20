'use strict';

var _ = require('underscore');
var util = require('lens/substance/util');

var LensConverter = require('lens/converter');

var LensArticle = require('lens/article');
var CustomNodeTypes = require('./nodes');

var JbjsConverter = function(options) {
  LensConverter.call(this, options);

  this.viewMapping.figure = 'content';
};

JbjsConverter.Prototype = function() {

  this.test = function(xmlDoc) {
//    var publisherName = xmlDoc.querySelector('publisher-name').textContent;
//    return publisherName === 'The Journal of Bone and Joint Surgery, Inc.';
    return true;
  };

  // Override document factory so we can create a customized Lens article,
  // including overridden node types
  this.createDocument = function() {
    var doc = new LensArticle({
      nodeTypes: CustomNodeTypes
    });
    return doc;
  };

  this.resolveURL = function(state, url) {
    // Use absolute URL
    if (url.match(/http:\/\//)) return url;

    // Look up base url
    var baseURL = this.getBaseURL(state);

    if (baseURL) {
      return [baseURL, url].join('');
    } else {
      // Use special URL resolving for production articles
      return [
        '/assets/docs/',
//        state.doc.id,
//        '/jpg/',
        url,
        '.jpeg'
      ].join('');
    }
  };

  this._bodyNodes['fig-group'] = function(state, child) {
    return this.figureGroup(state, child);
  };

  this.figureGroup = function(state, figureGroup) {
    var doc = state.doc;
    var childNodes = this.bodyNodes(state, util.dom.getChildren(figureGroup));

    var figureGroupNode = {
      type: 'figure_group',
      id: state.nextId('figure_group'),
      source_id: figureGroup.getAttribute('id'),
      position: 'float',
      orientation: 'portrait',
      caption: null,
      children: _.pluck(childNodes, 'id'),
    };

    var caption = figureGroup.querySelector('caption');
    if (caption) {
      var captionNode = this.caption(state, caption);
      if (captionNode) figureGroupNode.caption = captionNode.id;
    }

    var position = figureGroup.getAttribute('position');
    if (position) {
      figureGroupNode.position = position;
    }

    var orientation = figureGroup.getAttribute('orientaton');
    if (orientation) {
      figureGroupNode.orientation = orientation;
    }

    doc.create(figureGroupNode);

    return figureGroupNode;
  };

};

JbjsConverter.Prototype.prototype = LensConverter.prototype;
JbjsConverter.prototype = new JbjsConverter.Prototype();
JbjsConverter.prototype.constructor = JbjsConverter;

module.exports = JbjsConverter;

