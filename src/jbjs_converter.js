'use strict';

var _ = require('underscore');
var util = require('lens/substance/util');

var LensConverter = require('lens/converter');

var LensArticle = require('lens/article');
var CustomNodeTypes = require('./nodes');
var TwoColumnsCustomNodeTypes = require('./nodes/two_columns_index');
var CrossReferenceAbstractOnly = require('./nodes/cross_reference');

var JbjsConverter = function(options, config) {
  window.dev.trace('JbjsConverter');

  this.config = config;

  this.config.storage_layout = config.storage_layout || 'brackets';
  this.config.figure_url_lowercase = config.figure_url_lowercase || false;
  this.config.show_abstract_only = config.show_abstract_only || false;
  this.config.show_disclosure_href = this.config.show_disclosure_href || false;
  this.config.show_pdf_href = this.config.show_pdf_href || false;
  this.config.show_datasharing_href = this.config.show_datasharing_href || false;

  LensConverter.call(this, options);

  if ( !config.show_resources_panel || config.show_abstract_only ) {
    this.viewMapping.figure = 'content';
    this.viewMapping.figure_group = 'content';
    this.viewMapping.html_table = 'content';
    this.viewMapping.video = 'content';
    this.viewMapping.infographic = 'content';
    this.viewMapping.videosummary = 'content';
    this.viewMapping.authorinsights = 'content';
    this.viewMapping.supplement = 'content';
    this.viewMapping.eletter = 'content';
    this.viewMapping.eletter_submit = 'content';
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
    this.viewMapping.infographic = 'supplemental';
    this.viewMapping.videosummary = 'supplemental';
    this.viewMapping.authorinsights = 'supplemental';
    this.viewMapping.supplement = 'supplemental';
    this.viewMapping.eletter = 'supplemental';
    this.viewMapping.eletter_submit = 'supplemental';

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

  this.__ignoreCustomMetaNames = [
    'jbjs-published-as-jbjscc',
    'rsuite_processing_status',
    'rsuite_topics',
    'rsuite_files',
    'disclosure_pdf',
    'sdc',
    'article_pdf',
    'datasharing_pdf'
  ];
  this.__ignoreCustomMetaNamesHeader = [
    'peer-review-statement'
   ];
  this.__financialDisclosureAttrs = [
    'coi-statement',
    'financial-disclosure',
    'conflict'
  ];
  // ignore all <custom-meta> tags. This duplicates the two above.
  this.__ignoreAllCustomMeta = true;

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
    var rsuiteStatus = $(xmlDoc).find('article-meta custom-meta-group#rsuite_processing_status');

    if ( rsuiteStatus[0] ) {
      this.config.show_abstract_only = true;
      this.setAbstractOnly();
    }

    var rsuiteFiles = $(xmlDoc).find('article-meta custom-meta-group#rsuite_files');
    if ( rsuiteFiles[0] ) {
      var metas = rsuiteFiles[0].querySelectorAll('custom-meta');
      for (var i = 0; i < metas.length; ++i) {
        var name = metas[i].querySelector('meta-name');
        var value = metas[i].querySelector('meta-value');
        if( name && value ) {
          if ( name.textContent == 'disclosure_pdf' ){
            this.config.show_disclosure_href = (value.textContent == 'present');
          }
          if ( name.textContent == 'article_pdf' ){
            this.config.show_pdf_href = (value.textContent == 'present');
          }
          if ( name.textContent == 'datasharing_pdf' ){
            this.config.show_datasharing_href = (value.textContent == 'present');
          }
        }
      }
    }

    var volume = xmlDoc.querySelector("article-meta volume");
    var issue = xmlDoc.querySelector("article-meta issue");
    var fpage = xmlDoc.querySelector("article-meta fpage");
    var elocation = xmlDoc.querySelector("article-meta elocation-id");

    var page = fpage ? fpage.textContent : elocation.textContent;
    if( fpage && fpage.hasAttribute('seq') ) {
      page += 'a';
    }

    var volumeText = volume ? volume.textContent : '';
    var issueText = issue ? issue.textContent : '';

    this.imageFolder = this.isPAParticle(volumeText)
      ? 'PAP_' + page.replace(/\W/g, '') + '(1)'
      : volumeText + '_' + issueText + '_' + page + '(1)'

    if ( this.config.uppercase ) {
      this.imageFolder = this.imageFolder.toUpperCase();
    }

    return this.constructor.Prototype.prototype.document.call(this, state, xmlDoc);
  }

  // Override document factory so we can create a customized Lens article,
  // including overridden node types
  this.createDocument = function() {
    LensArticle.views.push('supplemental');

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
    if (!ext || url.substring(url.length - ext.length) === ext) {
      ext = '';
    }
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
    if (!ext || url.substring(url.length - ext.length) === ext) {
      ext = '';
    }
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
        (ext === '.pdf' || ext === '.supplement' || ext === '.eletter') ? this.docBaseUrl : this.imageBaseUrl,
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

    this.extractVideoSummary(state, article);
    this.extractInfographic(state, article);

    this.enhanceArticleSDC(state, article, true);
    this.extractELetters(state, article, true);

    this.extractAuthorInsights(state, article);

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

    this.showAuthorNotes(state, 'content');
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
    if(!node['url_ogv']) {
      node['url_ogv'] = element.getAttribute('href');
    }
    var obj = element.querySelector('object-id[content-type=media-stream-id]');
    if (obj) {
      node.url = obj.textContent;
    }
  };

  this.extractVideoSummary = function(state, xmlDoc) {
    var el = xmlDoc.querySelector('video-summary');

    if (!el) return;

    var nodes = [];

    if (el._converted) return;

    var node = this.videoSummary(state, el);
    var refNode = this.videoSummaryReference(state, el, node);

    refNode && nodes.push(refNode);
    node && nodes.push(node);

    this.show(state, nodes);
  };

  this.videoSummary = function(state, el) {
    var doc = state.doc;

    var videoSummaryNode = {
      id: 'videosummary',
      type: 'videosummary',
      label: 'Video Summary',
      url: el.getAttribute('video-id'),
      url_webm: 'By Id',
      poster: el.getAttribute('poster-url')
    };

    doc.create(videoSummaryNode);

    el._converted = true;

    return videoSummaryNode;
  };

  this.videoSummaryReference = function(state, el, node) {
    var doc = state.doc;

    var videoSummaryReferenceNode = {
      id: 'videosummary_reference',
      type: 'videosummary_reference',
      path: [ node.id, 'content' ],
      range: [ 0, node.length ],
      target: node.id
    };

    doc.create(videoSummaryReferenceNode);

    return videoSummaryReferenceNode;
  };

  this.extractAuthorInsights = function(state, xmlDoc) {
    var el = xmlDoc.querySelector('author-insights');

    if (!el) return;

    var nodes = [];

    if (el._converted) return;

    var node = this.authorInsights(state, el);
    var refNode = this.authorInsightsReference(state, el, node);

    refNode && nodes.push(refNode);
    node && nodes.push(node);

    this.show(state, nodes);
  };

  this.authorInsights = function(state, el) {
    var doc = state.doc;

    var authorInsightsNode = {
      id: 'authorinsights',
      type: 'authorinsights',
      label: 'Author Insights',
      url: el.getAttribute('video-id'),
      url_webm: 'By Id',
      poster: el.getAttribute('poster-url')
    };

    doc.create(authorInsightsNode);

    el._converted = true;

    return authorInsightsNode;
  };

  this.authorInsightsReference = function(state, el, node) {
    var doc = state.doc;

    var authorInsightsReferenceNode = {
      id: 'authorinsights_reference',
      type: 'authorinsights_reference',
      path: [ node.id, 'content' ],
      range: [ 0, node.length ],
      target: node.id
    };

    doc.create(authorInsightsReferenceNode);

    return authorInsightsReferenceNode;
  };

  this.extractInfographic = function(state, xmlDoc) {
    var el = xmlDoc.querySelector('infographic');

    if (!el) return;

    var nodes = [];

    if (el._converted) return;

    var node = this.infographic(state, el, !this.config.show_resources_panel);
    var refNode = this.infographicReference(state, el, node);

    refNode && nodes.push(refNode);
    node && nodes.push(node);

    this.show(state, nodes);
  };

  this.infographic = function(state, el, isMobile) {
    var doc = state.doc;

    var infographicNode = {
      id: 'infographic',
      type: 'infographic',
      label: 'Infographic',
      url: el.getAttribute('url'),
      isMobile: isMobile
    };

    doc.create(infographicNode);

    el._converted = true;

    return infographicNode;
  };

  this.infographicReference = function(state, el, node) {
    var doc = state.doc;

    var infographicReferenceNode = {
      id: 'infographic_reference',
      type: 'infographic_reference',
      path: [ node.id, 'content' ],
      range: [ 0, node.length ],
      target: node.id
    };

    doc.create(infographicReferenceNode);

    return infographicReferenceNode;
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
    this.extractAuthorNotes(state, article);

    // Make up a cover node
    this.extractCover(state, article);

    // Extract ArticleMeta
    this.extractArticleMeta(state, article);

    // workaround - do not show subtitle footnote reference in case of mobile abstract
    // where we do not show footnotes. Should be done by checking whether we show references
    if (!this.config.show_resources_panel && this.config.show_abstract_only) {
      state.doc.subtitle.notes = [];
    }

    if ( ! article.querySelector('front abstract') ) {
      var bodyP = article.querySelector('body p');
      if ( bodyP ) this.abstractFromParagraph(state, bodyP);
    }

    this.addLoginInfo(state);

    // Populate Publication Info node
    this.extractPublicationInfo(state, article);

    // catch all unhandled foot-notes
    this.extractFootNotes(state, article);

    this.showAffiliations(state, article);
    this.showAuthorNotes(state, 'info');

    this.extractVideoSummary(state, article);
    this.extractInfographic(state, article);

    this.extractELetters(state, article, false);

    this.extractAuthorInsights(state, article);
  };

  this.addLoginInfo = function(state) {
    var doc = state.doc;

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

    state.doc.show('content', login.id, 0);
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

  this.removeNoteId = function(array, noteId) {
    var idx = array.findIndex(function(id) {return id == noteId});
    if (idx != -1) array.splice(idx, 1);
  }
  // notes that come before copyright - non-referenced and subtitle
  this.extractNotes = function(state, article) {
    var nodes = [];
    var titleNodes = [];
    var doc = state.doc;

    // separate processing because financial-disclosure may have a few interleaved fn tags
    var fns = article.querySelectorAll('back fn-group fn, front author-notes fn');

    fns.forEach(function (note) {
      var isDisclosureNote = note.hasAttribute('fn-type')
              && this.__financialDisclosureAttrs.includes(note.getAttribute('fn-type'));
      if (isDisclosureNote) {
        // we have separate processing for disclosure
        this.removeNoteId(state.doc.authorNotes, note.id);
        this.removeNoteId(state.doc.subtitle.notes, note.id);
        return;
      }
      var isReferencedNote = note.hasAttribute('id')
        && article.querySelector('xref[ref-type=fn][rid=' + note.getAttribute('id') + ']') !== null;
      var isSubtitleNote = doc.subtitle.notes.includes(note.id);
      // this goes to the upper part of info panel
      var isArticleNote = isSubtitleNote || !isReferencedNote;
      if (isArticleNote) {
        if (isSubtitleNote) {
          titleNodes.push(this.footnote(state, note, 'article-note').id);
        } else if (!isReferencedNote) {
          var pars = this.bodyNodes(state, util.dom.getChildren(note));
          _.each(pars, function(par) {
            nodes.push(par.id);
          });
        }
        this.removeNoteId(state.doc.authorNotes, note.id);
      }
    }, this);

    state.doc.authorNotes.forEach(function(sourceId) {
      var note = state.xmlDoc.getElementById(sourceId);
      this.footnote(state, note, 'author-note');
    }, this);

    return titleNodes.concat(nodes);
  };

  this.extractKeywords = function(state, article) {
    var nodes = [];
    var doc = state.doc;

    var kwdElements = article.querySelectorAll('kwd-group[kwd-group-type=author] kwd');
    if (kwdElements.length) {
        var keywords = [];
        kwdElements.forEach(function(ke) {
          var kw = ke.textContent.trim();
          if (!keywords.includes(kw)) keywords.push(kw);
        });
        if (keywords.length) {
          var header = {
            type : 'heading',
            id : state.nextId('heading'),
            level : 3,
            content : 'Keywords'
          };
          doc.create(header);
          nodes.push(header.id);

          var keywordsNode = {
            id: state.nextId('text'),
            type: 'text',
            content: keywords.join('; ')
          };

          doc.create(keywordsNode);
          nodes.push(keywordsNode.id);
        }
    }

    return nodes;
  };


  this.extractCustomNotes = function(state, article) {
    var nodes = [];
    var doc = state.doc;

    if ( this.config.show_pdf_href ) {
      var pdf = article.querySelector('self-uri[*|title=pdf]');
      if (!pdf) {
        // if there is no xlink:title=pdf,
        // let's take pdf from self-uri with THE ONLY xlink:href attribute with pdf-file name.
        var pdfs = article.querySelectorAll('self-uri[*|href$=".pdf"]');
        pdfs.forEach(function(p) {
          if (p.attributes.length == 1) {
            pdf = p;
          }
        });
      }
      if( pdf && !this.config.show_abstract_only ) {
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
    }

    var discls = [];
    for (var i = 0; discls.length == 0 && i <  this.__financialDisclosureAttrs.length; i++ ) {
      var attr =  this.__financialDisclosureAttrs[i];
      discls = article.querySelectorAll('fn[fn-type=' + attr + ']');
    }

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
            label: 'Disclosures of Potential Conflicts of Interest',
            url: this.URLBuilder(uri.getAttribute('xlink:href'), '.pdf', 'disclosure'),
            caption: null
          };
          doc.create(supplementNode);
          nodes.push(supplementNode.id);
        }
        var uri = article.querySelector('self-uri[content-type=disclosure-zip]');
        uri = uri ?uri:article.querySelector('self-uri[content-type=disclosures-zip]');
        if ( uri ) {
          var supplementNode = {
            id: state.nextId('supplement'),
            source_id: null,
            type: 'supplement',
            label: 'Disclosures of Potential Conflicts of Interest',
            url: this.URLBuilder(uri.getAttribute('xlink:href'), '.zip', 'disclosure'),
            caption: null
          };
          doc.create(supplementNode);
          nodes.push(supplementNode.id);
        }
      }
    }

    // datasharing
    var ds = article.querySelector('back sec[type=data-availability]')
          || article.querySelector('back sec[sec-type=data-availability]');
    if (ds) {
        var title = ds.querySelector('title');
        var headingId = state.nextId('heading');
        var header = {
          type : 'heading',
          id : headingId,
          level : 3,
          content : title ? title.textContent : 'Data Sharing'
        };

        doc.create(header);
        nodes.push(header.id);

        var pars = this.bodyNodes(state, util.dom.getChildren(ds), {ignore : ["title"]});
        _.each(pars, function(par) {
          nodes.push(par.id);
        });

        if (this.config.show_datasharing_href ) {
            var uri = article.querySelector('self-uri[*|title=data-availability-pdf]');
            if ( uri ) {
              var url = uri.getAttribute('xlink:href');
              var ext = '.pdf';
              var supplementNode = {
                id: state.nextId('supplement'),
                source_id: null,
                type: 'supplement',
                label: 'Data Sharing PDF',
                url: this.URLBuilder(url, ext, 'dataavailability'),
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
    this.showAffiliations(state, article);
    this.showAuthorNotes(state, 'info');

    this.extractVideoSummary(state, article);
    this.extractInfographic(state, article);

    this.enhanceArticleSDC(state, article, false);
    this.extractELetters(state, article, false);

    this.extractAuthorInsights(state, article);
  };

  this.showAffiliations = function(state, article) {
    _.each(state.affiliations, function(n) {state.doc.show('info', n);});
  }

  this.showAuthorNotes = function(state, panelName) {
    _.each(state.doc.authorNotes, function(sourceId) {
      var note = state.doc.getNodeBySourceId(sourceId);
      if (note) {
        state.doc.show(panelName, note.id);
      }
    });
  }

  this.enhanceArticleSDC = function(state, article, oneColumnArticle) {
    var sdcMeta = _.find(article.querySelectorAll('article-meta custom-meta-group#rsuite_files custom-meta'),
      function(cm){ return cm.querySelector('meta-name').textContent == 'sdc'});

    var files;
    if ( sdcMeta ) {
      files = sdcMeta.querySelectorAll('meta-value inline-supplementary-material');
    } else if( this.config.manifest ) {
      files = this.config.manifest.querySelectorAll('file');
    } else {
      return;
    }

    var nodes = [];
    var doc = state.doc;
    var tabName = 'supplemental';

    if ( files.length > 0 ) {
      if (oneColumnArticle) {
        tabName = 'content';

        var header = {
          type : 'heading',
          id : state.nextId('heading'),
          level : 1,
          content : 'Supplementary Content',
        };

        doc.create(header);
        nodes.push(header.id);
        doc.show(tabName, header.id);

      }

      for (var i = 0; i < files.length; ++i) {
        var label;
        var url;
        if ( sdcMeta ) {
          label = files[i].textContent?files[i].textContent:'Data Supplement ' + (i + 1);
          url = this.URLBuilder(files[i].getAttribute('href'), '.supplement');
        } else {
          label = files[i].querySelector('description').textContent;
          url = this.URLBuilder(files[i].querySelector('filename').textContent);
        }

        var supplementNode = {
          id: state.nextId('supplement'),
          source_id: null,
          type: 'supplement',
          label: label,
          url: url,
          caption: null
        };

        doc.create(supplementNode);
        nodes.push(supplementNode.id);
        doc.show(tabName, supplementNode.id);
      }
    }
  };

  this.extractELetters = function(state, xmlDoc, oneColumnArticle) {
    var nodes = [],
      node = this.eLetterSubmit(state, oneColumnArticle),
      refNode = this.eLettersReference(state, node);

    refNode && nodes.push(refNode);
    node && nodes.push(node);

    var el = xmlDoc.querySelector('eletters');

    if (el && !el._converted) {
      var files = el.querySelectorAll('eletter');

      if (files.length) nodes = nodes.concat(this.eLetters(state, el, files));
    }

    this.show(state, nodes);
  };

  this.eLetterSubmit = function(state, oneColumnArticle) {
    var doc = state.doc,
        url = window.location.href,
        i = url.indexOf('#');

    if (i !== -1) url = url.substring(0, i);
    url = decodeURIComponent(url).replace('/fulltext', '/abstract').replace(/\s/g, '+');

    var eletterSubmitNode = {
      id: 'eletters',
      source_id: null,
      type: 'eletter_submit',
      label: 'Submit an eLetter',
      url: 'http://eletters.jbjs.org/?r=' + encodeURIComponent(url),
      caption: oneColumnArticle ? 'eLetters' : null,
      image: this.ResourceURLBuilder('Letter_to_Editor_Widget_Icon_Small.png')
    };

    doc.create(eletterSubmitNode);

    return eletterSubmitNode;
  };

  this.eLettersReference = function(state, node) {
    var doc = state.doc;

    var eletterReferenceNode = {
      id: 'eletter_reference',
      type: 'eletter_reference',
      path: [ node.id, 'content' ],
      range: [ 0, node.length ],
      target: node.id
    };

    doc.create(eletterReferenceNode);

    return eletterReferenceNode;
  };

  this.eLetters = function(state, el, files) {
    var doc = state.doc;

    var nodes = [];

    for (var i = 0; i < files.length; ++i) {
      var label = files[i].textContent ? files[i].textContent : 'eLetter ' + (i + 1);
      var url = this.URLBuilder(files[i].getAttribute('href'), '.eletter');

      var eletterNode = {
        id: state.nextId('eletter'),
        source_id: null,
        type: 'eletter',
        label: label,
        url: url,
        caption: null
      };

      doc.create(eletterNode);
      nodes.push(eletterNode);
    }

    el._converted = true;

    return nodes;
  };
/*
  this.extractELetters = function(state, article, oneColumnArticle) {
    var eLettersMeta = _.find(article.querySelectorAll('article-meta custom-meta-group#rsuite_files custom-meta'),
      function(cm){ return cm.querySelector('meta-name').textContent == 'eletters'});

    var files;
    if ( eLettersMeta ) {
      files = eLettersMeta.querySelectorAll('meta-value inline-eletter-material');
    } else if( this.config.manifest ) {
      files = this.config.manifest.querySelectorAll('file');
    } else {
      return;
    }

    if ( !files.length ) return;

    var nodes = [];
    var doc = state.doc;
    var tabName = 'supplemental';

    if (oneColumnArticle) {
      tabName = 'content';

      var header = {
        type : 'heading',
        id : 'eletters',
        level : 1,
        content : 'eLetters',
      };

      doc.create(header);
      doc.show(tabName, header.id);
    }

    var eletterSubmitNode = {
      id: oneColumnArticle ? 'eletter_submit' : 'eletters',
      source_id: null,
      type: 'eletter_submit',
      label: 'Submit eLetter',
      url: 'http://eletters.jbjs.org/?__hstc=104777119.85d50a516d737ac12a8673577c84f375.1561055554490.1561055554490.1561055554490.1&__hssc=104777119.1.1561055554491&__hsfp=379383135',
      caption: null,
      image: this.ResourceURLBuilder('Letter_to_Editor_Widget_Icon_Small.png')
    };

    doc.create(eletterSubmitNode);

    var eletterReferenceNode = oneColumnArticle
      ? {
          id: 'eletter_reference',
          type: 'eletter_reference',
          path: [ header.id, tabName ],
          range: [ 0, header.length ],
          target: header.id
        }
      : {
          id: 'eletter_reference',
          type: 'eletter_reference',
          path: [ eletterSubmitNode.id, tabName ],
          range: [ 0, eletterSubmitNode.length ],
          target: eletterSubmitNode.id
        };

    doc.create(eletterReferenceNode);

    doc.show(tabName, eletterSubmitNode.id);

    for (var i = 0; i < files.length; ++i) {
      var label;
      var url;
      if ( eLettersMeta ) {
        label = files[i].textContent?files[i].textContent:'eLetter ' + (i + 1);
        url = this.URLBuilder(files[i].getAttribute('href'), '.eletter');
      } else {
        label = files[i].querySelector('description').textContent;
        url = this.URLBuilder(files[i].querySelector('filename').textContent);
      }

      var eletterNode = {
        id: state.nextId('eletter'),
        source_id: null,
        type: 'eletter',
        label: label,
        url: url,
        caption: null
      };

      doc.create(eletterNode);
      doc.show(tabName, eletterNode.id);
    }
  };
*/
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

