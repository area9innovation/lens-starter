'use strict';

var _ = require('underscore');
var util = require('lens/substance/util');

var LensConverter = require('lens/converter');

var LensArticle = require('lens/article');
var CustomNodeTypes = require('./nodes');
var TwoColumnsCustomNodeTypes = require('./nodes/two_columns_index');
var CrossReferenceAbstractOnly = require('./nodes/cross_reference');

var JbjsConverter = function(options, config) {
  this.config = config;

  LensConverter.call(this, options);

  if ( !config.show_resources_panel || config.show_abstract_only ) {
    this.viewMapping.figure = 'content';
    this.viewMapping.html_table = 'content';
    this.viewMapping.video = 'content';
    this.createDocument = this.createDocumentOneColumn;
    this.enhanceArticle = this.enhanceArticleOneColumn;
    this.enhanceTable = this.enhanceTableOneColumn;

    delete this.ignoredParagraphElements['media'];
    this.acceptedParagraphElements['media'] =  { handler: 'video' };

    if ( config.show_abstract_only ) {
      this.article = this.articleAbstractOnly;
      CustomNodeTypes['cross_reference'] = CrossReferenceAbstractOnly;
      TwoColumnsCustomNodeTypes['cross_reference'] = CrossReferenceAbstractOnly;
    }
  } else {
    delete this._bodyNodes['fig-group'];
    delete this._bodyNodes['table-wrap'];

    delete this.ignoredParagraphElements['media'];
    this.acceptedParagraphElements['media'] =  { handler: 'video' };
  }

  this._refTypeMapping['table-fn'] = 'table_footnote_reference';

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
      nodeTypes: TwoColumnsCustomNodeTypes
    });
    return doc;
  };

  this.createDocumentOneColumn = function() {
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

  this._bodyNodes["table-wrap"] = function(state, child) {
    return this.tableWrap(state, child);
  };

  this._bodyNodes["media"] = function(state, child) {
    return this.video(state, child);
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

  this.enhanceArticleOneColumn = function(state, article) {
    _.each(state.doc.get('citations').nodes, function(n) {state.doc.show('content', n);});
  };

  this.enhanceTable = function(state, node, tableWrap) {
    this.enhanceTableFooters(state, node, tableWrap);
  };

  this.enhanceTableFooters = function(state, node, tableWrap) {
    var footers = tableWrap.querySelectorAll("table-wrap-foot fn");
    for (var i = 0; i < footers.length; ++i) {
      node.footers.push({
        label: footers[i].querySelector('label').textContent,
        content: footers[i].querySelector('p').textContent
      });
    }
  };

  this.enhanceTableOneColumn = function(state, node, tableWrap) {
    this.enhanceTableFooters(state, node, tableWrap);
    tableWrap._converted = true;
  };

  this.extractMedia = function(state, xmlDoc) {
    var figureElements = xmlDoc.querySelectorAll("media");
    var nodes = [];
    for (var i = 0; i < figureElements.length; ++i) {
      var figEl = figureElements[i];
      if (figEl._converted) continue;
      var type = util.dom.getNodeType(figEl);
      var node = null;
      if (type === "media") {
        node = this.video(state, figEl);
      }
      if (node) {
        nodes.push(node);
      }
    }
    this.show(state, nodes);
  };

  this.enhanceVideo = function(state, node, element) {
    node['url_ogv'] = element.getAttribute('xlink:href');
    var obj = element.querySelector('object-id[content-type=media-stream-id]');
    if (obj) {
      node.url = obj.textContent;
    }
  };

  this.articleAbstractOnly = function(state, article) {
    var doc = state.doc;

    var articleId = article.querySelector("article-id");

    if (articleId) {
      doc.id = articleId.textContent;
    } else {
      doc.id = util.uuid();
    }

    // Extract authors etc.
    this.extractAffilitations(state, article);
    this.extractContributors(state, article);

    // Make up a cover node
    this.extractCover(state, article);

    // Extract ArticleMeta
    this.extractArticleMeta(state, article);

    // Populate Publication Info node
    this.extractPublicationInfo(state, article);
  };
};

JbjsConverter.Prototype.prototype = LensConverter.prototype;
JbjsConverter.prototype = new JbjsConverter.Prototype();
JbjsConverter.prototype.constructor = JbjsConverter;

module.exports = JbjsConverter;

