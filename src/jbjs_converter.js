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

  this.config.storage_layout = config.storage_layout || 'brackets';
  this.config.figure_url_lowercase = config.figure_url_lowercase || false;
  this.config.show_abstract_only = config.show_abstract_only || false;
  this.config.show_disclosure_href = this.config.show_disclosure_href || false;

  LensConverter.call(this, options);

  if ( !config.show_resources_panel || config.show_abstract_only ) {
    this.viewMapping.figure = 'content';
    this.viewMapping.figure_group = 'content';
    this.viewMapping.html_table = 'content';
    this.viewMapping.video = 'content';
    this.createDocument = this.createDocumentOneColumn;
    this.enhanceArticle = this.enhanceArticleOneColumn;
    this.enhanceTable = this.enhanceTableOneColumn;
    this.app = this.appOneColumn;
    this.figureGroupChildNodes = this.figureGroupChildNodesOneColumn;
    this.back = this.backOneColumn;

    delete this.ignoredParagraphElements['media'];
    this.acceptedParagraphElements['media'] =  { handler: 'video' };

    this._refTypeMapping['table-fn'] = 'table_footnote_reference';

    if ( config.show_abstract_only ) {
      this.setAbstractOnly();
    }
  } else {
    delete this._bodyNodes['table-wrap'];

    delete this.ignoredParagraphElements['media'];
    this.acceptedParagraphElements['media'] =  { handler: 'video' };
  }

  this.imageFolder = '';
  this.docBaseUrl = '';

  if( this.config.storage_layout === 'jbjs_jtype' ) {
    this.URLBuilder = this.URLBuilderJBJSType;
  } else if ( this.config.storage_layout === 'db' ) {
    this.URLBuilder = this.URLBuilderDB;
  }
};

JbjsConverter.Prototype = function() {

  this.__ignoreCustomMetaNames = [ 'jbjs-published-as-jbjscc', 'rsuite_processing_status', 'rsuite_topics' ];
  this.__ignoreCustomMetaNamesHeader = [ 'peer-review-statement' ];

  this.test = function(xmlDoc, docUrl) {
    if ( this.config.storage_layout === 'db' ) {
      this.docBaseUrl = docUrl;      
      this.imageBaseUrl = this.config.image_url ? this.config.image_url : this.docBaseUrl;
    } else {
      this.docBaseUrl = docUrl.split('/').slice(0, -1).join('/');
      this.imageBaseUrl = this.docBaseUrl;
    }

//    var publisherName = xmlDoc.querySelector('publisher-name').textContent;
//    return publisherName === 'The Journal of Bone and Joint Surgery, Inc.';
    return true;
  };

  this.setAbstractOnly = function() {
      this.article = this.articleAbstractOnly;
      CustomNodeTypes['cross_reference'] = CrossReferenceAbstractOnly;
      TwoColumnsCustomNodeTypes['cross_reference'] = CrossReferenceAbstractOnly;
  };

  this.document = function(state, xmlDoc) {
    var rsuiteStatus = xmlDoc.querySelector("article-meta custom-meta-group#rsuite_processing_status");

    if ( rsuiteStatus ) {
      this.config.show_abstract_only = true;
      this.setAbstractOnly();
    }

    var volume = xmlDoc.querySelector("article-meta volume");
    var issue = xmlDoc.querySelector("article-meta issue");
    var fpage = xmlDoc.querySelector("article-meta fpage");
    var elocation = xmlDoc.querySelector("article-meta elocation-id");

    var page = fpage?fpage.textContent:elocation.textContent;
    if( fpage && fpage.hasAttribute('seq') ) {
      page += 'a';
    }

    this.imageFolder = volume.textContent + '_' + issue.textContent + '_' + page + '(1)';

    if ( this.config.uppercase ) {
      this.imageFolder = this.imageFolder.toUpperCase();
    }

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

  this.URLBuilder = function(url, ext) {
      return [
        this.docBaseUrl,
        '/',
        this.imageFolder,
        '/',
        url,
        ext
      ].join('');
  };

  this.ResourceURLBuilder = function(url) {
    return this.config.resources_url + url;
  };

  this.URLBuilderJBJSType = function(url, ext) {
      return [
        this.docBaseUrl,
        '/',
        url,
        ext
      ].join('');
  };

  this.URLBuilderDB = function(url, ext, subtype) {
      ext = typeof ext !== 'undefined' ?  ext : '.pdf';
      subtype = typeof subtype !== 'undefined' ?  subtype : '';
      return [
        ext === '.pdf' ? this.docBaseUrl : this.imageBaseUrl,
        '&type=', ext.substr(1),
        '&name=', url,
        '&subtype=', subtype,
      ].join('');
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
      return this.URLBuilder(
        this.config.figure_url_lowercase
        ?url.toLowerCase()
        :url
        , '.jpeg');
    }
  };

  this._bodyNodes["table-wrap"] = function(state, child) {
    return this.tableWrap(state, child);
  };

  this._bodyNodes["media"] = function(state, child) {
    return this.video(state, child);
  };

  this.enhanceArticleOneColumn = function(state, article) {
    _.each(state.doc.get('citations').nodes, function(n) {state.doc.show('content', n);});

    var doc = state.doc;

    this.enhanceArticleSDC(state, article);

    var header = {
      'type' : 'heading',
      'id' : state.nextId('heading'),
      'level' : 1,
      'content' : 'Additional information',
    };
    doc.create(header);
    doc.show('content', header.id);

    _.each(doc.get('info').nodes, function(n) {doc.show('content', n);});
    
    _.each(state.affiliations, function(n) {state.doc.show('content', n);});
  };

  this.enhanceTable = function(state, node, tableWrap) {
    this.enhanceTableFooters(state, node, tableWrap);
  };

  this.enhanceTableFooters = function(state, node, tableWrap) {
    var footers = tableWrap.querySelectorAll("table-wrap-foot fn");
    for (var i = 0; i < footers.length; ++i) {
      var label = footers[i].querySelector('label');
      node.footers.push({
        label: label ? label.textContent:'',
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

    if ( ! article.querySelector('front abstract') ) {
      this.abstractFromParagraph(state, article.querySelector('body p'));
    }

    this.addLoginInfo(state);

    // Populate Publication Info node
    this.extractPublicationInfo(state, article);
  };

  this.addLoginInfo = function(state) {
    var p = {
      id: state.nextId('paragraph'),
      type: 'paragraph',
      children: null
    };

    var login = {
      id: state.nextId('text'),
      type: 'text',
      content: 'Please register or login to see full text of this article'
    };

    doc.create(login);

    var link = {
      id: state.nextId('link'),
      type: 'link',
      url: this.config.return_url,
      path: [login.id, 'content'],
      range: [0, login.content.length],
    };

    state.annotations.push(link);

    p.children = [login.id];

    doc.create(p);
    this.show(state, [p]);
  };

  this.abstractFromParagraph = function(state, p) {
    var doc = state.doc;
    var nodes = [];

    var heading = {
      id: state.nextId('heading'),
      type: 'heading',
      level: 1,
      content: 'Abstract',
    };

    doc.create(heading);
    nodes.push(heading);

    delete this._annotationTypes['xref'];

    nodes = this.paragraphGroup(state, p);

    if ( nodes.length > 0 ) {
      this.show(state, nodes);
    }
  };

  this.extractNotes = function(state, article) {
    var nodes = [];
    var doc = state.doc;

    var pdf = article.querySelector('self-uri[*|title=pdf]');
    if( pdf && ! this.config.show_abstract_only ) {
      var url = this.URLBuilder(pdf.getAttribute('xlink:href'));

      if( this.config.storage_layout === 'jbjs_jtype' ) {
        var pub_id = article.querySelector('article-id[pub-id-type=publisher-id]');
        if ( pub_id ) {
          url = this.URLBuilder(pub_id.textContent, '.pdf');
        }
      }

      var supplementNode = {
        id: state.nextId('supplement'),
        source_id: null,
        type: 'supplement',
        label: 'Open article PDF',
        url: url,
        caption: null,
        icon: this.ResourceURLBuilder('Adobe_PDF_file_icon_32x32.png'),
      };
      doc.create(supplementNode);
      nodes.push(supplementNode.id);
    }

    // separate processing because financial-disclosure may have a few interleaved fn tags
    var fns = article.querySelectorAll('back fn-group fn');

    for (var i = 0; i < fns.length; ++i) {
      if ( (!fns[i].hasAttribute('fn-type') 
      || fns[i].getAttribute('fn-type') !== 'financial-disclosure')
      && (!fns[i].hasAttribute('id') 
      || article.querySelector('xref[ref-type=fn][rid=' + fns[i].getAttribute('id') + ']') === null) ) {
        var pars = this.bodyNodes(state, util.dom.getChildren(fns[i]));
        _.each(pars, function(par) {
          nodes.push(par.id);
        });
      }
    }

    var discls = article.querySelectorAll('fn[fn-type=financial-disclosure]');

    if ( discls.length > 0 ) {
      var header = {
        type : 'heading',
        id : state.nextId('heading'),
        level : 3,
        content : 'Disclosures of Potential Conflicts of Interest',
      };

      doc.create(header);
      nodes.push(header.id);

      for (var i = 0; i < discls.length; ++i) {
        var pars = this.bodyNodes(state, util.dom.getChildren(discls[i]));
        _.each(pars, function(par) {
          nodes.push(par.id);
        });
      }

      if ( this.config.show_disclosure_href ) {
        var uri = article.querySelector('self-uri[content-type=disclosure-pdf]');
        uri = uri ?uri:article.querySelector('self-uri[content-type=disclosures-pdf]');
        if ( uri ) {
          var supplementNode = {
            id: state.nextId('supplement'),
            source_id: null,
            type: 'supplement',
            label: 'Disclosures of Potential Conflicts of Interest PDF',
            url: this.URLBuilder(uri.getAttribute('xlink:href'), '.pdf', 'disclosure'),
            caption: null
          };
          doc.create(supplementNode);
          nodes.push(supplementNode.id);
        }
      }
    }

    return nodes;
  };

  this.enhancePublicationInfo = function(state, pubInfoNode) {
    this.pubInfoNodeId = pubInfoNode.id;
  };

  this.enhanceArticle = function(state, article) {
    _.each(state.affiliations, function(n) {state.doc.show('info', n);});

    this.enhanceArticleSDC(state, article);
  };

  this.enhanceArticleSDC = function(state, article) {
    if ( this.config.manifest === undefined ) return;

    var nodes = [];
    var doc = state.doc;

    var files = this.config.manifest.querySelectorAll('file');

    if ( files.length > 0 ) {
      var header = {
        type : 'heading',
        id : state.nextId('heading'),
        level : 1,
        content : 'Second data suppliment files',
      };

      doc.create(header);
      nodes.push(header.id);
      doc.show('content', header.id);

      for (var i = 0; i < files.length; ++i) {
        var supplementNode = {
          id: state.nextId('supplement'),
          source_id: null,
          type: 'supplement',
          label: files[i].querySelector('description').textContent,
          url: this.URLBuilder(files[i].querySelector('filename').textContent),
          caption: null
        };
        doc.create(supplementNode);
        nodes.push(supplementNode.id);
        doc.show('content', supplementNode.id);
      }
    }
  };

  this.appOneColumn = function(state, app) {
    delete this._bodyNodes['table-wrap'];

    this.constructor.Prototype.prototype.app.call(this, state, app);
  };

  this.figureGroupChildNodesOneColumn = function(state, figureGroup) {
    return this.bodyNodes(state, util.dom.getChildren(figureGroup));
  };

  this.backOneColumn = function(state, back) {
    this.constructor.Prototype.prototype.back.call(this, state, back);

    var refList = back.querySelector('ref-list');
    if( !refList ) return;

    var title = refList.querySelector('title');

    var headingId =state.nextId(heading);

    var heading = state.doc.create({
      type : 'heading',
      id : headingId,
      level : 1,
      content : title ? this.annotatedText(state, title, [headingId, 'content']) : 'References',
    });

    this.show(state, [heading]);
  };
};

JbjsConverter.Prototype.prototype = LensConverter.prototype;
JbjsConverter.prototype = new JbjsConverter.Prototype();
JbjsConverter.prototype.constructor = JbjsConverter;

module.exports = JbjsConverter;

