'use strict';

var _ = require('underscore');
var util = require('lens/substance/util');

var LensConverter = require('lens/converter');

var LensArticle = require('lens/article');
var CustomNodeTypes = require('./nodes');

var JbjsConverter = function(options, config) {
  this.config = config;

  LensConverter.call(this, options);

  if (!config.show_resources_panel) {
    this.viewMapping.figure = 'content';
  } else {
    delete this._bodyNodes['fig-group'];
  }

  this.imageFolder = '';
  this.docBaseUrl = '';
};

JbjsConverter.Prototype = function() {

  this.test = function(xmlDoc, docUrl) {
    this.docBaseUrl = docUrl.split('/').slice(0, -1).join('/');

//    var publisherName = xmlDoc.querySelector('publisher-name').textContent;
//    return publisherName === 'The Journal of Bone and Joint Surgery, Inc.';
    return true;
  };

  this.document = function(state, xmlDoc) {
    var volume = xmlDoc.querySelector("volume");
    var issue = xmlDoc.querySelector("issue");
    var fpage = xmlDoc.querySelector("fpage");

    this.imageFolder = volume.textContent + '_' + issue.textContent + '_' + fpage.textContent + '(1)';

    return this.constructor.Prototype.prototype.document.call(this, state, xmlDoc);
  }

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
        this.docBaseUrl,
        '/',
        this.imageFolder,
        '/',
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

