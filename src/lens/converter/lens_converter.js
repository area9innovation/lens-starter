"use strict";

var _ = require("underscore");
var util = require("../substance/util");
var errors = util.errors;
var ImporterError = errors.define("ImporterError");
var Article = require("../article");
var articleUtil = require("../article/article_util");

var NlmToLensConverter = function(options) {
  this.options = options || NlmToLensConverter.DefaultOptions;
};

NlmToLensConverter.Prototype = function() {

  this._annotationTypes = {
    "bold": "strong",
    "italic": "emphasis",
    "monospace": "code",
    "sub": "subscript",
    "sup": "superscript",
    "sc": "custom_annotation",
    "roman": "custom_annotation",
    "sans-serif": "custom_annotation",
    "styled-content": "custom_annotation",
    "underline": "underline",
    "ext-link": "link",
    "xref": "",
    "email": "link",
    "named-content": "",
    "inline-formula": "inline-formula",
    "uri": "link",
    "article-title": "strong",
    "source": "emphasis",
    "string-name": "",
    "break": "break",
  };

  this._inlineNodeTypes = {
    "fn": true,
  };

  // mapping from xref.refType to node type
  this._refTypeMapping = {
    "bibr": "citation_reference",
    "fig": "figure_reference",
    "table": "figure_reference",
    "supplementary-material": "figure_reference",
    "other": "figure_reference",
    "list": "definition_reference",
    "fn": "footnote_reference",
    "table-fn": "footnote_reference",
  };

  // mapping of contrib type to human readable names
  // Can be overriden in specialized converter
  this._contribTypeMapping = {
    "author": "Author",
    "author non-byline": "Author",
    "autahor": "Author",
    "auther": "Author",
    "editor": "Editor",
    "guest-editor": "Guest Editor",
    "group-author": "Group Author",
    "collab": "Collaborator",
    "reviewed-by": "Reviewer",
    "nominated-by": "Nominator",
    "corresp": "Corresponding Author",
    "other": "Other",
    "assoc-editor": "Associate Editor",
    "associate editor": "Associate Editor",
    "series-editor": "Series Editor",
    "contributor": "Contributor",
    "chairman": "Chairman",
    "monographs-editor": "Monographs Editor",
    "contrib-author": "Contributing Author",
    "organizer": "Organizer",
    "chair": "Chair",
    "discussant": "Discussant",
    "presenter": "Presenter",
    "guest-issue-editor": "Guest Issue Editor",
    "participant": "Participant",
    "translator": "Translator"
  };

  this.isAnnotation = function(type) {
    return this._annotationTypes[type] !== undefined;
  };

  this.isInlineNode = function(type) {
    return this._inlineNodeTypes[type] !== undefined;
  };

  this.isParagraphish = function(node) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var el = node.childNodes[i];
      if (el.nodeType !== Node.TEXT_NODE && !this.isAnnotation(el.tagName.toLowerCase())) return false;
    }
    return true;
  };

  this.test = function(xml, documentUrl) {
    /* jshint unused:false */
    return true;
  };

  // Helpers
  // --------

  this.getName = function(nameEl) {
    if (!nameEl) return "N/A";
    var names = [];
    var name = "";

    var surnameEl = nameEl.querySelector("surname");
    var givenNamesEl = nameEl.querySelector("given-names");
    var suffix = nameEl.querySelector("suffix");
    var prefix = nameEl.querySelector("prefix");

    if (givenNamesEl) names.push(givenNamesEl.textContent.trim());
    if (surnameEl) names.push(surnameEl.textContent.trim());

    name = names.join(" ");

    if (name === "") {
      return name;
    }

    if (prefix) {
      prefix = prefix.textContent.trim();
      if (prefix !== "") {
        name = prefix + " " + name;
      }
    }

    if (suffix) {
      suffix = suffix.textContent.trim();
      if (suffix !== "") {
        name = name + ", " + suffix;
      }
    }

    return name;
  };

  this.toHtml = function(el) {
    if (!el) return "";
    var tmp = document.createElement("DIV");
    tmp.appendChild(el.cloneNode(true));
    return tmp.innerHTML;
  };

  this.mmlToHtmlString = function(el) {
    var html = this.toHtml(el);
    html = html.replace(/<(\/)?mml:([^>]+)>/g, "<$1$2>");
    return html;
  };

  this.selectDirectChild = function(scopeEl, selector) {
    // Note: if the ':scope' pseudo class was supported by more browsers
    // it would be the correct selector based solution.
    // However, for now we do simple filtering.
    var el = scopeEl.querySelector(selector);
    if (el && el.parentNode === scopeEl) {
        return el;
    }
    return null;
  };

  this.selectDirectChildren = function(scopeEl, selector) {
    // Note: if the ':scope' pseudo class was supported by more browsers
    // it would be the correct selector based solution.
    // However, for now we do simple filtering.
    var result = [];
    var els = scopeEl.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.parentNode === scopeEl) result.push(el);
    }
    return result;
  };

  // ### The main entry point for starting an import

  this.import = function(input) {
    var xmlDoc;

    // Note: when we are using jqueries get("<file>.xml") we
    // magically get a parsed XML document already
    if (_.isString(input)) {
      var parser = new DOMParser();
      xmlDoc = parser.parseFromString(input,"text/xml");
    } else {
      xmlDoc = input;
    }

    this.sanitizeXML(xmlDoc);

    // Creating the output Document via factore, so that it is possible to
    // create specialized NLMImporter later which would want to instantiate
    // a specialized Document type
    var doc = this.createDocument();

    // For debug purposes
    window.doc = doc;

    // A deliverable state which makes this importer stateless
    var state = this.createState(xmlDoc, doc);

    // Note: all other methods are called corresponding
    return this.document(state, xmlDoc);
  };

  // Sometimes we need to deal with unconsistent XML
  // When overwriting this function in your custom converter
  // you can solve those issues in a preprocessing step instead of adding
  // hacks in the main converter code

  this.sanitizeXML = function(xmlDoc) {
    /* jshint unused:false */
  };

  this.createState = function(xmlDoc, doc) {
    return new NlmToLensConverter.State(this, xmlDoc, doc);
  };

  // Overridden to create a Lens Article instance
  this.createDocument = function() {

    var doc = new Article();
    return doc;
  };

  this.show = function(state, nodes) {
    _.each(nodes, function(n) {
      this.showNode(state, n);
    }, this);
  };

  this.extractDate = function(dateEl) {
    if (!dateEl) return null;

    var year  = dateEl.querySelector("year");
    var month = dateEl.querySelector("month");
    var day   = dateEl.querySelector("day");

    var res = [ year.textContent ];
    if (month) {
      var monthNum = this.normalizeMonth(month.textContent);
      if (monthNum) {
        res.push(monthNum);
        if (day)
          res.push(day.textContent);
      } else {
        // non-standard month is treated like season
        res.push(month.textContent);
      }
    } else {
      var season = dateEl.querySelector("season");
      if (season)
        res.push(season.textContent);
    }
    return res.join("/");
  };

  this.normalizeMonth = function(month) {
    var monthNum = parseInt(month, 10);
    if( isNaN(monthNum) ) {
      monthNum = articleUtil.monthSymToNum(month);
    }
    return monthNum;
  };

  this.isPAParticle = function (volume) {
    return volume && volume.toLowerCase() == 'publish ahead of print';
  }

  this.extractRelatedArticles = function(state, article) {
    const nodes = [];
    const doc = state.doc;

    const relatedArticles = article.querySelectorAll("related-article");
    for (const ra of relatedArticles) {
      const linkType = ra.getAttribute("ext-link-type");
      const doiType = linkType && linkType == "doi";
      const href =  ra.getAttribute("xlink:href");
      if (!href || !doiType) {
        continue;
      }

      const relatedArticle = {
        type: 'related_article',
        id: state.nextId('related_article'),
        article_type: ra.getAttribute("related-article-type"),
        doi: href,
      };
      doc.create(relatedArticle);
      nodes.push(relatedArticle.id);
    }

    return nodes;
  }

  this.extractPublicationInfo = function(state, article) {
    var doc = state.doc;

    var articleMeta = article.querySelector("article-meta");
    var history = articleMeta.querySelectorAll("history date");

    // Journal title
    //
    var journalTitle = article.querySelector("journal-title");

    // DOI
    //
    // <article-id pub-id-type="doi">10.7554/eLife.00003</article-id>
    var articleDOI = article.querySelector("article-id[pub-id-type=doi]");


    // <subj-group subj-group-type="heading">
    // <subject>Immunology</subject>
    // </subj-group>
    // <subj-group subj-group-type="heading">
    // <subject>Microbiology and infectious disease</subject>
    // </subj-group>

    var subjects = articleMeta.querySelectorAll("subj-group[subj-group-type=heading] subject");

    // Article information
    var articleInfo = this.extractArticleInfo(state, article);

    // Funding information
    var fundingInfo = this.extractFundingInfo(state, article);

    var volumeEl = articleMeta.querySelector("volume");
    var issueEl  = articleMeta.querySelector("issue");

    var volume = volumeEl ? volumeEl.textContent : '';
    var issue  = issueEl  ? issueEl.textContent : '';
    var isPAP = this.isPAParticle(volume);

    var fpage = '';
    var fpageEl = articleMeta.querySelector("fpage");
    if ( !fpageEl && !isPAP) {
      fpageEl = articleMeta.querySelector("elocation-id");
    }
    if ( fpageEl ) {
      fpage = fpageEl.textContent;
    }

    var pubDates = this.extractPublicationDates(article, isPAP);

    // Create PublicationInfo node
    // ---------------

    var pubInfoNode = {
      "id": "publication_info",
      "type": "publication_info",
      "first_published_on": pubDates.first_published_on,
      "published_on": pubDates.published_on,
      "journal": journalTitle ? journalTitle.textContent : "",
      "doi": articleDOI ? articleDOI.textContent : "",
      "article_info": articleInfo.id,
      "funding_info": fundingInfo,
      // TODO: 'article_type' should not be optional; we need to find a good default implementation
      "article_type": "",
      // Optional fields not covered by the default implementation
      // Implement config.enhancePublication() to complement the data
      // TODO: think about how we could provide good default implementations
      "keywords": [],
      "links": [],
      "subjects": subjects && subjects.length > 0 ? _.pluck(subjects, "textContent") : [],
      "supplements": [],
      "history": [],
      // TODO: it seems messy to have this in the model
      // Instead it would be cleaner to add 'custom': 'object' field
      "research_organisms": [],
      // TODO: this is in the schema, but seems to be unused
      "provider": "",
      "published_info": {volume: volume, issue: issue, fpage: fpage },
      "is_pap" : isPAP
    };

    for (var i = 0; i < history.length; i++) {
      var dateEl = history[i];
      var historyEntry = {
        type: dateEl.getAttribute('date-type'),
        date: this.extractDate(dateEl)
      };
      pubInfoNode.history.push(historyEntry);
    }

    doc.create(pubInfoNode);
    doc.show("info", pubInfoNode.id, 0);

    this.enhancePublicationInfo(state, pubInfoNode);
  };

  this.extractPublicationDates = function(article, isPAP) {
      var dates = article.querySelectorAll("pub-date");
      if (!dates.length) {
        return {
          published_on : null,
          first_published_on : null
        };
      }
      var epub       = article.querySelector("pub-date[pub-type=epub]"),
          ppub       = article.querySelector("pub-date[pub-type=ppub]"),
          epub_ppub  = article.querySelector("pub-date[pub-type=epub-ppub]"),
          collection = article.querySelector("pub-date[pub-type=collection]"),
          def        = article.querySelector("pub-date:not([pub-type])");

      var pubDate = null,
          firstPubDate = null;

      if (!epub && epub_ppub) epub = epub_ppub;
      if (!ppub && epub_ppub) ppub = epub_ppub;

      if (epub)            firstPubDate = epub
      else if (ppub)       firstPubDate = ppub
      else if (collection) firstPubDate = collection
      else if (def)         firstPubDate = def;

      if (isPAP)           pubDate = firstPubDate
      else if (collection) pubDate = collection
      else if (ppub)       pubDate = ppub
      else if (def)        pubDate = def;

      return {
        first_published_on : this.extractDate(firstPubDate),
        published_on : this.extractDate(pubDate)
      };
  };

  this.extractArticleInfo = function(state, article) {
    // Initialize the Article Info object
    var articleInfo = {
      "id": "articleinfo",
      "type": "paragraph",
    };
    var doc = state.doc;

    var nodes = [];

    // Reviewing editor
    nodes = nodes.concat(this.extractEditor(state, article));
    // Datasets
    nodes = nodes.concat(this.extractDatasets(state, article));
    // Includes meta information (such as impact statement for eLife)
    nodes = nodes.concat(this.extractCustomMetaGroup(state, article));
    // Notes (<note> elements)
    nodes = nodes.concat(this.extractNotes(state, article));
    // Keywords
    nodes = nodes.concat(this.extractKeywords(state, article));
    // Related article
    nodes = nodes.concat(this.extractRelatedArticles(state, article));
    // License and Copyright
    nodes = nodes.concat(this.extractCopyrightAndLicense(state, article));
    // Custom notes - datasharing, disclosure, etc.
    nodes = nodes.concat(this.extractCustomNotes(state, article));

    // Keep acknowledgments aside to insert thenm into the body before appendix
    doc.acknowledgementNodes = this.extractAcknowledgements(state, article);

    articleInfo.children = nodes;
    doc.create(articleInfo);

    return articleInfo;
  };

  this.extractFundingInfo = function(state, article) {
    var fundingInfo = [];
    var fundingStatementEls = article.querySelectorAll("funding-statement");
    if (fundingStatementEls.length > 0){
      for (var i = 0; i < fundingStatementEls.length; i++) {
        fundingInfo.push(this.annotatedText(state, fundingStatementEls[i], ["publication_info", "funding_info", i]));
      }
    }

    return fundingInfo;
  };

  // Get reviewing editor
  // --------------
  // TODO: it is possible to have multiple editors. This does only show the first one
  //   However, this would be easy: just querySelectorAll and have 'Reviewing Editors' as heading when there are multiple nodes found

  this.extractEditor = function(state, article) {
    var nodes = [];
    var doc = state.doc;

    var editor = article.querySelector("contrib[contrib-type=editor]");
    if (editor) {
      var content = [];

      var name = this.getName(editor.querySelector('name'));
      if (name) content.push(name);
      var inst = editor.querySelector("institution");
      if (inst) content.push(inst.textContent);
      var country = editor.querySelector("country");
      if (country) content.push(country.textContent);

      var h1 = {
        "type": "heading",
        "id": state.nextId("heading"),
        "level": 3,
        "content": "Reviewing Editor"
      };

      doc.create(h1);
      nodes.push(h1.id);

      var t1 = {
        "type": "text",
        "id": state.nextId("text"),
        "content": content.join(", ")
      };

      doc.create(t1);
      nodes.push(t1.id);
    }
    return nodes;
  };

  //
  // Extracts major datasets
  // -----------------------

  this.extractDatasets = function(state, article) {
    var nodes = [];
    var doc = state.doc;

    var datasets = article.querySelectorAll('sec');
    for (var i = 0;i <datasets.length;i++){
      var data = datasets[i];
      var type = data.getAttribute('sec-type');
      if (type === 'datasets') {
        var h1 = {
          "type" : "heading",
          "id" : state.nextId("heading"),
          "level" : 3,
          "content" : "Major Datasets"
        };
        doc.create(h1);
        nodes.push(h1.id);
        var ids = this.datasets(state, util.dom.getChildren(data));
        for (var j=0;j < ids.length;j++) {
          if (ids[j]) {
            nodes.push(ids[j]);
          }
        }
      }
    }
    return nodes;
  };

  var _capitalized = function(str, all) {
    if (all) {
      return str.split(' ').map(function(s){
        return _capitalized(s);
      }).join(' ');
    } else {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  };

  this.capitalized = function(str, all) {
    return _capitalized(str, all);
  };

  //
  // Extracts Acknowledgements
  // -------------------------

  this.extractAcknowledgements = function(state, article) {
    var nodes = [];
    var doc = state.doc;

    var acks = article.querySelectorAll("ack");
    if (acks && acks.length > 0) {
      _.each(acks, function(ack) {
        var title = ack.querySelector('title');
        var header = {
          "type" : "heading",
          "id" : state.nextId("heading"),
          "level" : 1,
          "content" : title ? this.capitalized(title.textContent.toLowerCase(), "all") : "Acknowledgements"
        };

        doc.create(header);
        nodes.push(header);

        // There may be multiple paragraphs per ack element
        var pars = this.bodyNodes(state, util.dom.getChildren(ack), {
          ignore: ["title"]
        });

        _.each(pars, function(par) {
          nodes.push(par);
        });
      }, this);
    }

    return nodes;
  };

  //
  // Extracts notes (non-authorship footnotes) that should be shown in article info
  // ------------------------------------------
  //
  this.extractNotes = function(state, article) {
    /* jshint unused:false */
    return [];
  };

  this.extractKeywords = function(state, article) {
    /* jshint unused:false */
    return [];
  };

  //
  // Extracts custom notes (disclosure, datasharing, etc.) that should be shown in article info
  // ------------------------------------------
  //
  this.extractCustomNotes = function(state, article) {
    /* jshint unused:false */
    return [];
  };

  // Can be overridden by custom converter to ignore <meta-name> values.
  // TODO: Maybe switch to a whitelisting approach, so we don't show
  // nonsense. See HighWire implementation
  this.__ignoreCustomMetaNames = [];
  this.__ignoreCustomMetaNamesHeader = [];

  this.__ignoreAllCustomMeta = false;

  this.extractCustomMetaGroup = function(state, article) {
    if (this.__ignoreAllCustomMeta) {
      return [];
    }
    var nodeIds = [];
    var doc = state.doc;

    var customMetaEls = article.querySelectorAll('article-meta custom-meta');
    if (customMetaEls.length === 0) return nodeIds;

    for (var i = 0; i < customMetaEls.length; i++) {
      var customMetaEl = customMetaEls[i];

      var metaNameEl = customMetaEl.querySelector('meta-name');
      var metaValueEl = customMetaEl.querySelector('meta-value');

      if (!_.include(this.__ignoreCustomMetaNames, metaNameEl.textContent)) {
        if(!_.include(this.__ignoreCustomMetaNamesHeader, metaNameEl.textContent)) {
          var header = {
            "type" : "heading",
            "id" : state.nextId("heading"),
            "level" : 3,
            "content" : ""
          };
          header.content = this.annotatedText(state, metaNameEl, [header.id, 'content']);
          doc.create(header);
          nodeIds.push(header.id);
        }

        var bodyNodes = this.paragraphGroup(state, metaValueEl);

        nodeIds = nodeIds.concat(_.pluck(bodyNodes, 'id'));
      }
    }
    return nodeIds;
  };

  //
  // Extracts Copyright and License Information
  // ------------------------------------------

  this.extractCopyrightAndLicense = function(state, article) {
    var nodes = [];
    var doc = state.doc;

    var license = article.querySelector("permissions");
    if (license) {
      var h1 = {
        "type" : "heading",
        "id" : state.nextId("heading"),
        "level" : 3,
        "content" : "Copyright & License"
      };
      doc.create(h1);
      nodes.push(h1.id);

      // TODO: this is quite messy. We should introduce a dedicated note for article info
      // and do that rendering related things there, e.g., '. ' separator

      var par;
      var copyright = license.querySelector("copyright-statement");
      if (copyright) {
        par = this.paragraphGroup(state, copyright);
        if (par && par.length) {
          nodes = nodes.concat( _.map(par, function(p) { return p.id; } ) );
          // append '.' only if there is none yet
          if (copyright.textContent.trim().slice(-1) !== '.') {
            // TODO: this needs to be more robust... what if there are no children
            var textid = _.last(_.last(par).children);
            doc.nodes[textid].content += ". ";
          }
        }
      }
      var lic = license.querySelector("license");
      if (lic) {
        for (var child = lic.firstElementChild; child; child = child.nextElementSibling) {
          var type = util.dom.getNodeType(child);
          if (type === 'p' || type === 'license-p') {
            par = this.paragraphGroup(state, child);
            if (par && par.length) {
              nodes = nodes.concat( _.pluck(par, 'id') );
            }
          }
        }
      }
    }

    return nodes;
  };

  this.extractCover = function(state, article) {
    var doc = state.doc;
    var docNode = doc.get("document");
    var cover = {
      id: "cover",
      type: "cover",
      title: docNode.title,
      subtitle: docNode.subtitle,
      authors: [], // docNode.authors,
      abstract: docNode.abstract
    };

    // Create authors paragraph that has contributor_reference annotations
    // to activate the author cards

    _.each(docNode.authors, function(contributorId) {
      var contributor = doc.get(contributorId);

      var name = contributor.name
        + (contributor.degrees ? ', ' + contributor.degrees : '');

      var authorsPara = {
        "id": "text_"+contributorId+"_reference",
        "type": "text",
        "content": name
      };

      doc.create(authorsPara);
      cover.authors.push(authorsPara.id);

      var anno = {
        id: state.nextId("contributor_reference"),
        type: "contributor_reference",
        path: ["text_" + contributorId + "_reference", "content"],
        range: [0, name.length],
        target: contributorId
      };

      doc.create(anno);
    }, this);

    // Move to elife configuration
    // -------------------
    // <article-categories>
    // <subj-group subj-group-type="display-channel">...</subj-group>
    // <subj-group subj-group-type="heading">...</subj-group>
    // </article-categories>

    // <article-categories>
    //   <subj-group subj-group-type="display-channel">
    //     <subject>Research article</subject>
    //   </subj-group>
    //   <subj-group subj-group-type="heading">
    //     <subject>Biophysics and structural biology</subject>
    //   </subj-group>
    // </article-categories>

    this.enhanceCover(state, cover, article);

    doc.create(cover);
    doc.show("content", cover.id, 0);
  };

  // Note: Substance.Article supports only one author.
  // We use the first author found in the contribGroup for the 'creator' property.
  // 'topLevel' is for nested contrib groups. Only contributors from top level group
  // are authors shown in article title section

  this.contribGroup = function(state, contribGroup, topLevel) {
    var i;
    var contribs = this.selectDirectChildren(contribGroup, "contrib");
    if (contribs.length && !state.doc.nodes.document.authors.length) {
      var h1 = {
        "type" : "heading",
        "id" : state.nextId("heading") + "_author_list",
        "level" : 3,
        "content" : "Authors"
      };
      state.doc.create(h1);
      state.doc.show("info", h1.id);
    }

    for (i = 0; i < contribs.length; i++) {
      this.contributor(state, contribs[i], topLevel);
    }
    // Extract on-behalf-of element and stick it to the document
    var doc = state.doc;
    var on_behalf_of = contribGroup.querySelector("on-behalf-of");
    if (on_behalf_of) {
      this.on_behalf_of(state, contribGroup, on_behalf_of);
    }
  };

  this.on_behalf_of = function (state, contribGroup, on_behalf_of) {
    var doc = state.doc;
    var text = this.normalizeOnBehalfOfText(on_behalf_of.textContent);
    doc.on_behalf_of = text;

    // hack: we treat on-behalf-of as contributor because it is shown exactly as contributor.
    var on_behalf_of_node = {
      id: state.nextId("contributor"),
      type: "contributor",
      name: text,
      footnotes: []
    };

    doc.nodes.document.authors.push(on_behalf_of_node.id);
    doc.create(on_behalf_of_node);
    doc.show("info", on_behalf_of_node.id);

    var xref = contribGroup.querySelector('on-behalf-of + xref[ref-type=fn]');
    if (!xref) return;

    var fnId = xref.getAttribute("rid");
    var fnElem = state.xmlDoc.getElementById(fnId);
    if (!fnElem) return;

    var fnLabel = fnElem.querySelector("label");
    if (!fnLabel) return;

    var fnLabelText = fnLabel.textContent;
    if (!fnLabelText) return;

    var fn = state.doc.getNodeBySourceId(fnElem.getAttribute("id"));
    if (!fn) {
      fn = this.footnote(state, fnElem, 'author-note');
    }
    if (fn) {
      on_behalf_of_node.footnotes.push(fn.id);
      state.used[fnId] = true;
    }
  }

  this.normalizeOnBehalfOfText = function(onBehalfOf) {
    return "on behalf of " + onBehalfOf.trim().replace(/^on\s+behalf\s+of\s/i, "");
  }

  this.affiliation = function(state, aff) {
    var doc = state.doc;

    var department = aff.querySelector("institution[content-type=dept]");
    if (department) {
      var institution = aff.querySelector("institution:not([content-type=dept])");
    } else {
      var department = aff.querySelector("addr-line named-content[content-type=department]");
      var institution = aff.querySelector("institution");
    }
    var country = aff.querySelector("country");
    var labelEl = aff.querySelector("label");

    var city = aff.querySelector("addr-line named-content[content-type=city]");
    // TODO: there are a lot more elements which can have this.
    var specific_use = aff.getAttribute('specific-use');

    var affId = state.nextId("affiliation");
    var affRef = state.nextId("affiliation_reference");

    var text = this.annotatedText(state, aff, [affId, 'relaxed_text'], {
        ignore: ['label']
      });

    var label = '';
    var source_id = aff.getAttribute('id');

    if ( labelEl ) {
      label = labelEl.textContent;
    } else {
      var sup = state.xmlDoc.querySelector('xref[ref-type=aff][rid=' +  source_id + '] sup');
      if ( sup ) {
        label = sup.textContent;
      } else if ( source_id ) {
        label = source_id.replace( /^\D+/g, '');
      }
    }

    // TODO: this is a potential place for implementing a catch-bin
    // For that, iterate all children elements and fill into properties as needed or add content to the catch-bin

    var affiliationNode = {
      id: affId,
      type: "affiliation",
      source_id: source_id,
      label: label,
      department: department ? department.textContent : null,
      city: city ? city.textContent : null,
      institution: institution ? institution.textContent : null,
      country: country ? country.textContent: null,
      specific_use: specific_use || null,
      relaxed_text: text || null,
      reference_id: affRef,
    };
    doc.create(affiliationNode);
    state.affiliations.push(affId);

    if ( affiliationNode.label ) {
      var anno = {
        id: affRef,
        type: "affiliation_reference",
        path: [affId , "label"],
        range: [0, affiliationNode.label.length],
        target: affId
      };

      doc.create(anno);
    }
  };

  this.contributor = function(state, contrib, topLevel) {
    var doc = state.doc;

    var id = state.nextId("contributor");
    var contribNode = {
      id: id,
      source_id: contrib.getAttribute("id"),
      type: "contributor",
      name: "",
      affiliations: [],
      footnotes:[],
      fundings: [],
      bio: [],

      // Not yet supported... need examples
      image: "",
      deceased: false,
      emails: [],
      contribution: "",
      members: [],
      degrees: ""
    };

    // Extract contrib type
    var contribType = contrib.getAttribute("contrib-type");
    if (!contribType) {
      return;
    }

    // do not show some types
    const ignoredContribTypes = ["author non-byline"];
    var skip = ignoredContribTypes.some(function(ignored) { return contribType == ignored; });
    if (skip) {
      return;
    }

    // Assign human readable version
    contribNode["contributor_type"] = this._contribTypeMapping[contribType];

    // Extract role
    var role = this.selectDirectChild(contrib, "role");
    if (role) {
      contribNode["role"] = role.textContent;
    }

    // Search for author bio and author image
    var bio = this.selectDirectChild(contrib, "bio");
    if (bio) {
      _.each(util.dom.getChildren(bio), function(par) {
        var graphic = par.querySelector("graphic");
        if (graphic) {
          var imageUrl = graphic.getAttribute("xlink:href");
          contribNode.image = imageUrl;
        } else {
          var pars = this.paragraphGroup(state, par);
          if (pars.length > 0) {
            contribNode.bio = [ pars[0].id ];
          }
        }
      }, this);
    }

    // Deceased?

    if (contrib.getAttribute("deceased") === "yes") {
      contribNode.deceased = true;
    }

    // Extract ORCID
    // -----------------
    //
    // <uri content-type="orcid" xlink:href="http://orcid.org/0000-0002-7361-560X"/>
    // or
    // <contrib-id authenticated="false" contrib-id-type="orcid">http://orcid.org/0000-0002-8808-1137</contrib-id>
    var orcidURI = this.selectDirectChild(contrib, "uri[content-type=orcid]");
    if (orcidURI) {
      contribNode.orcid = orcidURI.getAttribute("xlink:href");
    } else {
      orcidURI = this.selectDirectChild(contrib, "contrib-id[contrib-id-type=orcid]");
      if (orcidURI)
        contribNode.orcid = orcidURI.textContent;
    }

    // Extracting equal contributions
    var collab = this.selectDirectChild(contrib, "collab");
    var collabContribGroup = collab && this.selectDirectChild(collab, "contrib-group");
    var collabHasTags = collab && util.dom.getChildren(collab).length;

    var nameEl = this.selectDirectChild(contrib, "name");

    if (nameEl) {
      contribNode.name = this.getName(nameEl);
    } else if (collab) {
      // Assuming this is an author group
        contribNode.name = $($(collab).contents().get(0)).text().trim();
    } else {
        contribNode.name = "N/A";
    }

    var propertyHolder = collabContribGroup || collabHasTags ? collab : contrib;
    this.extractContributorProperties(state, propertyHolder, contribNode);

    // HACK (disabled for now): for cases where no explicit xrefs are given per
    // contributor we assin all available affiliations
    // unless there is a footnote
    if (false && contribNode.affiliations.length === 0 && contribNode.footnotes.length === 0) {
      contribNode.affiliations = state.affiliations;
    }

    // HACK: if author is assigned a conflict, remove the redundant
    // conflict entry "The authors have no competing interests to declare"
    // This is a data-modelling problem on the end of our input XML
    // so we need to be smart about it in the converter
    if (contribNode.competing_interests.length > 1) {
      contribNode.competing_interests = _.filter(contribNode.competing_interests, function(confl) {
        return confl.indexOf("no competing") < 0;
      });
    }

    var isAuthor = contribType === "author";
    if (isAuthor && topLevel) {
      doc.nodes.document.authors.push(id);
    }

    var degrees = this.selectDirectChild(contrib, "degrees");
    if (degrees) {
      contribNode.degrees = degrees.textContent;
    }

    doc.create(contribNode);
    doc.show("info", contribNode.id);

    if (collabContribGroup) {
      this.contribGroup(state, collabContribGroup, false);
    }
  };

  this._getEqualContribs = function (state, contrib, contribId) {
    var result = [];
    var refs = state.xmlDoc.querySelectorAll("xref[rid="+contribId+"]");
    // Find xrefs within contrib elements
    _.each(refs, function(ref) {
      var c = ref.parentNode;
      if (c !== contrib) {
        var name = this.getName(c.querySelector("name"));
        if (name) result.push(name);
      }
    }, this);
    return result;
  };

  this.extractContributorProperties = function(state, contrib, contribNode) {
    var doc = state.doc;

    // Extract equal contributors
    var equalContribs = [];
    var compInterests = [];

    // extract affiliations stored as xrefs
    var xrefs = this.selectDirectChildren(contrib, "xref");
    _.each(xrefs, function(xref) {
      if (xref.getAttribute("ref-type") === "aff") {
        var affId = xref.getAttribute("rid");
        var affNode = doc.getNodeBySourceId(affId);
        if (affNode) {
          contribNode.affiliations.push(affNode.id);
          state.used[affId] = true;
        }
      } else if (xref.getAttribute("ref-type") === "other") {
        // FIXME: it seems *very* custom to interprete every 'other' that way
        // TODO: try to find and document when this is applied
        console.log("FIXME: please add documentation about using 'other' as indicator for extracting an awardGroup.");

        var awardGroup = state.xmlDoc.getElementById(xref.getAttribute("rid"));
        if (!awardGroup) return;
        var fundingSource = awardGroup.querySelector("funding-source");
        if (!fundingSource) return;
        var awardId = awardGroup.querySelector("award-id");
        awardId = awardId ? ", "+awardId.textContent : "";
        // Funding source nodes are looking like this
        //
        // <funding-source>
        //   National Institutes of Health
        //   <named-content content-type="funder-id">http://dx.doi.org/10.13039/100000002</named-content>
        // </funding-source>
        //
        // and we only want to display the first text node, excluding the funder id
        // or this
        //
        // They can also look like this
        //
        // <funding-source>
        //   <institution-wrap>
        //     <institution-id institution-id-type="FundRef">http://dx.doi.org/10.13039/100005156</institution-id>
        //     <institution>Alexander von Humboldt-Stiftung</institution>
        //   </institution-wrap>
        // </funding-source>
        // Then we take the institution element

        var institution = fundingSource.querySelector('institution')
        var fundingSourceName = institution ? institution.textContent : fundingSource.childNodes[0].textContent;
        contribNode.fundings.push([fundingSourceName, awardId].join(''));
      } else if (xref.getAttribute("ref-type") === "corresp") {
        var correspId = xref.getAttribute("rid");
        var corresp = state.xmlDoc.querySelector('[id="'+correspId+'"]');
        if (!corresp) return;
        // TODO: a corresp element allows *much* more than just an email
        // Thus, we are leaving this like untouched, so that it may be grabbed by extractAuthorNotes()
        // state.used[correspId] = true;
        var emails = corresp.querySelectorAll("email");
        if (!emails) return;
        contribNode.emails = contribNode.emails.concat(_.map(emails, (email => email.textContent)));
      } else if (xref.getAttribute("ref-type") === "fn") {
        var fnId = xref.getAttribute("rid");
        var fnElem = state.xmlDoc.getElementById(fnId);
        var authorNote = false;
        var used = true;
        if (fnElem) {
          var fnType = fnElem.getAttribute("fn-type");
          switch (fnType) {
            case "con":
              contribNode.contribution = fnElem.textContent;
              break;
            case "conflict":
              compInterests.push(fnElem.textContent.trim());
              break;
            case "present-address":
              contribNode.present_address = fnElem.querySelector("p").textContent;
              break;
            case "equal":
              console.log("FIXME: isn't fnElem.getAttribute(id) === fnId?");
              // equal contribution is treated as simple author notes
              // equalContribs = this._getEqualContribs(state, contrib, fnElem.getAttribute("id"));
              authorNote = true;
              break;
            case "other":
              // HACK: sometimes equal contribs are encoded as 'other' plus special id
              console.log("FIXME: isn't fnElem.getAttribute(id) === fnId?");
              if (fnElem.getAttribute("id").indexOf("equal-contrib")>=0) {
                // equal contribution is treated as simple author notes
                //equalContribs = this._getEqualContribs(state, contrib, fnElem.getAttribute("id"));
                authorNote = true;
              } else {
                used = false;
              }
              break;
            default:
              authorNote = true;
              used = false;
          }
          if (authorNote) {
            var fnLabel = fnElem.querySelector("label");
            if (fnLabel) {
              var fnLabelText = fnLabel.textContent;
              var fn = state.doc.getNodeBySourceId(fnElem.getAttribute("id"));
              if (!fn) {
                fn = this.footnote(state, fnElem, 'author-note');
              }
              if (fnLabelText && fn) {
                contribNode.footnotes.push(fn.id);
                used = true;
              }
            }
          }
          if (used) state.used[fnId] = true;
        }
      } else {
        // TODO: this is a potential place for implementing a catch-bin
        // For that, we could push the content of the referenced element into the contrib's catch-bin
        console.log("Skipping contrib's xref", xref.textContent);
      }
    }, this);

    // Extract member list for person group
    // eLife specific?
    // ----------------

    if (compInterests.length > 1) {
      compInterests = _.filter(compInterests, function(confl) {
        return confl.indexOf("no competing") < 0;
      });
    }

    contribNode.competing_interests = compInterests;
    var memberList = this.selectDirectChild(contrib, "xref[ref-type=other]");

    if (memberList) {
      var memberListId = memberList.getAttribute("rid");
      var members = state.xmlDoc.querySelectorAll("#"+memberListId+" contrib");
      contribNode.members = _.map(members, function(m) {
        return this.getName(m.querySelector("name"));
      }, this);
    }

    contribNode.equal_contrib = equalContribs;
    contribNode.competing_interests = compInterests;
  };

  // Parser
  // --------
  // These methods are used to process XML elements in
  // using a recursive-descent approach.


  // ### Top-Level function that takes a full NLM tree
  // Note: a specialized converter can derive this method and
  // add additional pre- or post-processing.

  this.document = function(state, xmlDoc) {
    var doc = state.doc;
    var article = xmlDoc.querySelector("article");
    if (!article) {
      throw new ImporterError("Expected to find an 'article' element.");
    }
    // recursive-descent for the main body of the article
    this.article(state, article);
    this.postProcess(state);
    // Rebuild views to ensure consistency
    _.each(doc.containers, function(container) {
      container.rebuild();
    });
    return doc;
  };

  this.postProcess = function(state) {
    this.postProcessAnnotations(state);
  };

  this.postProcessAnnotations = function(state) {
    // Creating the annotations afterwards, to make sure
    // that all referenced nodes are available
    for (var i = 0; i < state.annotations.length; i++) {
      var anno = state.annotations[i];
      if (anno.target) {
        var targetNode = state.doc.getNodeBySourceId(anno.target);
        if (targetNode) {
          anno.target = targetNode.id;
        } else {
          // NOTE: I've made this silent because it frequently occurs that no targetnode is
          // available (e.g. for inline formulas)
          // console.log("Could not lookup targetNode for annotation", anno);
        }
      }
      state.doc.create(state.annotations[i]);
    }
  };

  // Article
  // --------
  // Does the actual conversion.
  //
  // Note: this is implemented as lazy as possible (ALAP) and will be extended as demands arise.
  //
  // If you need such an element supported:
  //  - add a stub to this class (empty body),
  //  - add code to call the method to the appropriate function,
  //  - and implement the handler here if it can be done in general way
  //    or in your specialized importer.

  this.article = function(state, article) {
    var doc = state.doc;

    // Assign id
    var articleId = article.querySelector("article-id");
    // Note: Substance.Article does only support one id
    if (articleId) {
      doc.id = articleId.textContent;
    } else {
      // if no id was set we create a random one
      doc.id = util.uuid();
    }

    // Extract glossary
    this.extractDefinitions(state, article);

    // Extract authors etc.
    this.extractAffilitations(state, article);
    this.extractAuthorNotes(state, article);
    this.extractContributors(state, article);

    // Same for the citations, also globally
    this.extractCitations(state, article);

    // Make up a cover node
    this.extractCover(state, article);

    // Extract ArticleMeta
    this.extractArticleMeta(state, article);

    // Populate Publication Info node. Should go after articleMeta to have subtitle notes in state
    this.extractPublicationInfo(state, article);

    var body = article.querySelector("body");
    if (body) {
      this.body(state, body);
    }

    this.extractFigures(state, article);

    // catch all unhandled foot-notes
    this.extractFootNotes(state, article);

    // Extract back element, if it exists
    var back = article.querySelector("back");
    if (back){
        this.back(state,back);
    }

    this.enhanceArticle(state, article);
  };

  this.extractDefinitions = function(state /*, article*/) {
    var defItems = state.xmlDoc.querySelectorAll("def-item");

    _.each(defItems, function(defItem) {
      var term = defItem.querySelector("term");
      var def = defItem.querySelector("def");

      // using hwp:id as a fallback MCP articles don't have def.id set
      var id = def.id || def.getAttribute("hwp:id") || state.nextId('definition');

      var definitionNode = {
        id: id,
        type: "definition",
        title: term.textContent,
        description: def.textContent
      };

      state.doc.create(definitionNode);
      state.doc.show("definitions", definitionNode.id);
    });
  };

  // #### Front.ArticleMeta
  //

  this.extractArticleMeta = function(state, article) {
    var articleMeta = article.querySelector("article-meta");
    if (!articleMeta) {
      throw new ImporterError("Expected element: 'article-meta'");
    }

    // <article-id> Article Identifier, zero or more
    var articleIds = articleMeta.querySelectorAll("article-id");
    this.articleIds(state, articleIds);

    // <title-group> Title Group, zero or one
    var titleGroup = articleMeta.querySelector("title-group");
    if (titleGroup) {
      this.titleGroup(state, titleGroup);
    }

    // <pub-date> Publication Date, zero or more
    var pubDates = articleMeta.querySelectorAll("pub-date");
    this.pubDates(state, pubDates);

    this.abstracts(state, articleMeta);

    // Not supported yet:
    // <trans-abstract> Translated Abstract, zero or more
    // <kwd-group> Keyword Group, zero or more
    // <conference> Conference Information, zero or more
    // <counts> Counts, zero or one
    // <custom-meta-group> Custom Metadata Group, zero or one
  };

  this.extractAffilitations = function(state, article) {
    var affiliations =  article.querySelectorAll("aff");
    for (var i = 0; i < affiliations.length; i++) {
      this.affiliation(state, affiliations[i]);
    }
  };

  this.extractAuthorNotes = function(state, article) {
    var authorNotes =  article.querySelectorAll("author-notes fn");
    authorNotes.forEach(function(note) {
      state.doc.authorNotes.push(note.getAttribute('id'));
    });
  };

  this.extractContributors = function(state, article) {
    // TODO: the spec says, that there may be any combination of
    // 'contrib-group', 'aff', 'aff-alternatives', and 'x'
    var this_ =  this;
    var contribGroups = article.querySelectorAll("article-meta > contrib-group");
    _.each(contribGroups, function (contribGroup) {
      this_.contribGroup(state, contribGroup, true);
    });
  };


  // Catch-all implementation for figures et al.
  this.extractFigures = function(state, xmlDoc) {
    // Globally query all figure-ish content, <fig>, <supplementary-material>, <table-wrap>, <media video>
    // mimetype="video"

    // NOTE: We previously only considered figures within <body> but since
    // appendices can also have figures we now use a gobal selector.
    var figureElements = xmlDoc.querySelectorAll("fig:not([fig-type=thumb]), table-wrap, supplementary-material, media[mimetype=video]");
    var nodes = [];
    for (var i = 0; i < figureElements.length; i++) {
      var figEl = figureElements[i];
      // skip converted elements
      if (figEl._converted) continue;
      var type = util.dom.getNodeType(figEl);
      var node = null;
      if (type === "fig") {
        node = this.figure(state, figEl);
      } else if (type === "table-wrap") {
        node = this.tableWrap(state, figEl);
      } else if (type === "media") {
        node = this.video(state, figEl);
      } else if (type === "supplementary-material") {
        node = this.supplement(state, figEl);
      }
      if (node) {
        nodes.push(node);
      }
    }
    this.show(state, nodes);
  };

  // Catch-all implementation for footnotes that have not been
  // converted yet.
  this.extractFootNotes = function(state, article) {
    var fnEls = article.querySelectorAll('fn');
    for (var i = 0; i < fnEls.length; i++) {
      var fnEl = fnEls[i];
      if (fnEl.__converted__) continue;
      this.footnote(state, fnEl);
    }
    this.makeNoteReferences(state);
  }

  this.makeNoteReferences = function(state) {
    var doc = state.doc;
    var notes = [].concat(doc.authorNotes, doc.title.notes, doc.subtitle.notes);
    notes.forEach(function(sourceId) {
      var footnote = doc.getNodeBySourceId(sourceId);
      if (!footnote || !footnote.properties || footnote.properties.label == '') {
        return;
      }
      var refIndex = Object.keys(doc.nodes).findIndex(function(key) {
        var node = doc.nodes[key];
        return node.properties
                && node.properties.id
                && node.properties.id == footnote.properties.reference_id
      });
      if (refIndex == -1) {
        var anno = {
          id: footnote.properties.reference_id,
          type: "footnote_reference",
          path: [footnote.properties.id , "label"],
          range: [0, footnote.properties.label.length],
          target: footnote.properties.id
        };
        doc.create(anno);
      }
    });
  }

  this.extractCitations = function(state, xmlDoc) {
    var refList = xmlDoc.querySelector("ref-list");
    if (refList) {
      this.refList(state, refList);
    }
  };

  // articleIds: array of <article-id> elements
  this.articleIds = function(state, articleIds) {
    var doc = state.doc;

    // Note: Substance.Article does only support one id
    if (articleIds.length > 0) {
      doc.id = articleIds[0].textContent;
    } else {
      // if no id was set we create a random one
      doc.id = util.uuid();
    }
  };

	this.titleGroup = function(state, titleGroup) {
		var doc = state.doc;
		const articleTitle = titleGroup.querySelector("article-title");
		if (articleTitle) {
			doc.title.text = this.annotatedText(state, articleTitle, ['document', 'title', 'text'], {
				ignore: ['xref']
			});
			const titleNotes = articleTitle.querySelectorAll("xref[rid^='fn']");
			titleNotes.forEach(function(note) {
				doc.title.notes.push(note.getAttribute('rid'));
			});
		}

    var articleSubtitle = titleGroup.querySelector("subtitle");
    if (articleSubtitle) {
      doc.subtitle.text = this.annotatedText(state, articleSubtitle, ['document', 'subtitle', 'text'], {
        ignore: ['xref']
      });
      var subtitleNotes =  articleSubtitle.querySelectorAll("xref[rid^='fn']");
      subtitleNotes.forEach(function(note) {
        doc.subtitle.notes.push(note.getAttribute('rid'));
      });
    }
  };

  // Note: Substance.Article supports no publications directly.
  // We use the first pub-date for created_at
  this.pubDates = function(state, pubDates) {
    var doc = state.doc;
    if (pubDates.length > 0) {
      var converted = this.pubDate(state, pubDates[0]);
      doc.created_at = converted.date;
    }
  };

  // Note: this does not follow the spec but only takes the parts as it was necessary until now
  // TODO: implement it thoroughly
  this.pubDate = function(state, pubDate) {
    var day = -1;
    var month = -1;
    var year = -1;
    _.each(util.dom.getChildren(pubDate), function(el) {
      var type = util.dom.getNodeType(el);

      var value = el.textContent;
      if (type === "day") {
        day = parseInt(value, 10);
      } else if (type === "month") {
        month = this.normalizeMonth(value);
        month = month ? month : 1;
      } else if (type === "year") {
        year = parseInt(value, 10);
      }
    }, this);
    var date = new Date(year, month, day);
    return {
      date: date
    };
  };

  this.abstracts = function(state, articleMeta) {
    // <abstract> Abstract, zero or more
    var abstracts = articleMeta.querySelectorAll("abstract");
    _.each(abstracts, function(abs) {
      this.abstract(state, abs);
    }, this);
  };

  // TODO: abstract should be a dedicated node
  // as it can have some extra information in JATS, such as specific-use
  this.abstract = function(state, abs) {
    var doc = state.doc;
    var nodes = [];

    var title = abs.querySelector("title");

    if (title && title.parentNode.tagName!=='abstract') {
      title = undefined;
    }

    var heading = {
      id: state.nextId("heading"),
      type: "heading",
      level: 1,
      content: title ? title.textContent : "Abstract"
    };

    doc.create(heading);
    nodes.push(heading);

    _.each(util.dom.getChildren(abs), function(child) {
      if (child.tagName == 'sec') {
        this.makeAbstractParagraph(child);
      }
    }, this);


    // with eLife there are abstracts having an object-id.
    // TODO: we should store that in the model instead of dropping it
    state.sectionLevel++;
    nodes = nodes.concat(this.bodyNodes(state, util.dom.getChildren(abs), {
      ignore: ["title", "object-id"]
    }));
    state.sectionLevel--;

    var abstract = {
      id: "abstract",
      type: "abstract",
      sections: [],
    };

    _.each(nodes, function(node) {
        if (node.content == heading.content) {
          abstract.sections.push(node.id);
        }
        // skip heading titles, they already added in paragraphs with  makeAbstractParagraph
        if (node.type != "heading") {
          abstract.sections.push(node.id);
        }
    }, this);

    doc.create(abstract);
    doc.show("content", abstract.id, 1);
    doc.nodes.document.abstract = abstract;
  };


  this.makeAbstractParagraph = function(element) {
      var paragraphs = this.selectDirectChildren(element, "p");
      if (paragraphs.length > 0) {
        var titles = this.selectDirectChildren(element, "title");
        if (titles.length > 0) {
          paragraphs[0].innerHTML = "<bold>" + titles[0].innerHTML + "</bold> " + paragraphs[0].innerHTML;
        }
      }
  };

  // ### Article.Body
  //
  this.body = function(state, body) {
    var doc = state.doc;
    var nodes = this.bodyNodes(state, util.dom.getChildren(body));
    nodes = nodes.concat(doc.acknowledgementNodes);
    if (nodes.length > 0) {
      this.show(state, nodes);
    }
  };

  this._ignoredBodyNodes = {
    // figures and table-wraps are treated globally
    "fig": true,
    "table-wrap": true
  };

  // Top-level elements as they can be found in the body or
  // in a section
  // Note: this is also used for boxed-text elements
  this._bodyNodes = {};

  this.bodyNodes = function(state, children, options) {
    var nodes = [], node;

    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var type = util.dom.getNodeType(child);

      if (this._bodyNodes[type]) {
        var result = this._bodyNodes[type].call(this, state, child);
        if (_.isArray(result)) {
          nodes = nodes.concat(result);
        } else if (result) {
          nodes.push(result);
        } else {
          // skip
        }
      } else if (this._ignoredBodyNodes[type] || (options && options.ignore && options.ignore.indexOf(type) >= 0) ) {
        // Note: here are some node types ignored which are
        // processed in an extra pass (figures, tables, etc.)
        node = this.ignoredNode(state, child, type);
        if (node) nodes.push(node);
      } else {
        console.error("Node not supported as block-level element: " + type +"\n"+child.outerHTML);
      }
    }
    return nodes;
  };

  this._bodyNodes["p"] = function(state, child) {
    return this.paragraphGroup(state, child);
  };
  this._bodyNodes["sec"] = function(state, child) {
    return this.section(state, child);
  };
  this._bodyNodes["list"] = function(state, child) {
    return this.list(state, child);
  };
  this._bodyNodes["disp-formula"] = function(state, child) {
    return this.formula(state, child);
  };
  this._bodyNodes["caption"] = function(state, child) {
    return this.caption(state, child);
  };
  this._bodyNodes["boxed-text"] = function(state, child) {
    return this.boxedText(state, child);
  };
  this._bodyNodes["disp-quote"] = function(state, child) {
    return this.quoteText(state, child);
  };
  this._bodyNodes["attrib"] = function(state, child) {
    return this.paragraphGroup(state, child);
  };
  this._bodyNodes["comment"] = function(state, child) {
    return this.comment(state, child);
  };

  this._bodyNodes['fig-group'] = function(state, child) {
    return this.figureGroup(state, child);
  };

  this._bodyNodes["fig"] = function(state, child) {
    return this.figure(state, child);
  };

  this._bodyNodes['verse-group'] = function(state, child) {
    return this.verseGroup(state, child);
  };

  this._bodyNodes['verse-line'] = function(state, child) {
    return this.verseLine(state, child);
  };

  // Overwirte in specific converter
  this.ignoredNode = function(/*state, node, type*/) {
  };

  this.comment = function(/*state, comment*/) {
    // TODO: this is not yet represented in the article data model
    return null;
  };

  this.boxedText = function(state, box) {
    var doc = state.doc;
    // Assuming that there are no nested <boxed-text> elements
    var childNodes = this.bodyNodes(state, util.dom.getChildren(box));
    var boxId = state.nextId("box");
    var boxNode = {
      "type": "box",
      "id": boxId,
      "source_id": box.getAttribute("id"),
      "label": "",
      "children": _.pluck(childNodes, 'id')
    };
    doc.create(boxNode);
    return boxNode;
  };

  this.quoteText = function (state, quote) {
    var doc = state.doc;
    // Assuming that there are no nested <disp-quote> elements
    var childNodes = this.bodyNodes(state, util.dom.getChildren(quote));
    var quoteId = state.nextId("quote");
    var quoteNode = {
      "type": "quote",
      "id": quoteId,
      "source_id": quote.getAttribute("id"),
      "label": "",
      "children": _.pluck(childNodes, 'id')
    };
    doc.create(quoteNode);
    return quoteNode;
  };

  this.datasets = function(state, datasets) {
    var nodes = [];

    for (var i=0;i<datasets.length;i++) {
      var data = datasets[i];
      var type = util.dom.getNodeType(data);
      if (type === 'p') {
        var obj = data.querySelector('related-object');
        if (obj) {
          nodes = nodes.concat(this.indivdata(state,obj));
        }
        else {
          var par = this.paragraphGroup(state, data);
          if (par.length > 0) nodes.push(par[0].id);
        }
      }
    }
    return nodes;
  };

  this.indivdata = function(state,indivdata) {
    var doc = state.doc;

    var p1 = {
      "type" : "paragraph",
      "id" : state.nextId("paragraph"),
      "children" : []
    };
    var text1 = {
      "type" : "text",
      "id" : state.nextId("text"),
      "content" : ""
    };
    p1.children.push(text1.id);
    var input = util.dom.getChildren(indivdata);
    for (var i = 0;i<input.length;i++) {
      var info = input[i];
      var type = util.dom.getNodeType(info);
      var par;
      if (type === "name") {
        var children = util.dom.getChildren(info);
        for (var j = 0;j<children.length;j++) {
          var name = children[j];
          if (j === 0) {
            par = this.paragraphGroup(state,name);
            p1.children.push(par[0].children[0]);
          }
          else {
            var text2 = {
              "type" : "text",
              "id" : state.nextId("text"),
              "content" : ", "
            };
            doc.create(text2);
            p1.children.push(text2.id);
            par = this.paragraphGroup(state,name);
            p1.children.push(par[0].children[0]);
          }
        }
      }
      else {
        par = this.paragraphGroup(state,info);
        // Smarter null reference check?
        if (par && par[0] && par[0].children) {
          p1.children.push(par[0].children[0]);
        }
      }
    }
    doc.create(p1);
    doc.create(text1);
    return p1.id;
  };

  this.section = function(state, section) {
    // pushing the section level to track the level for nested sections
    state.sectionLevel++;

    var doc = state.doc;
    var children = util.dom.getChildren(section);
    var nodes = [];

    // Optional heading label
    var label = this.selectDirectChildren(section, "label")[0];

    // create a heading
    var title = this.selectDirectChildren(section, 'title')[0];
    if (!title) {
      console.error("FIXME: every section should have a title", this.toHtml(section));
    }

    // Recursive Descent: get all section body nodes
    nodes = nodes.concat(this.bodyNodes(state, children, {
      ignore: ["title", "label"]
    }));

    if (nodes.length > 0 || title) {
      var id = state.nextId("heading");
      var heading = {
        id: id,
        source_id: section.getAttribute("id"),
        type: "heading",
        level: state.sectionLevel,
        content: title ? this.annotatedText(state, title, [id, 'content']) : ""
      };

      if (label) {
        heading.label = label.textContent;
      }

      if (heading.content.length > 0) {
        doc.create(heading);
        nodes.unshift(heading);
      }
    } else if (nodes.length === 0) {
      console.info("NOTE: skipping section without content:", title ? title.innerHTML : "no title");
    }

    // popping the section level
    state.sectionLevel--;
    return nodes;
  };

  this.ignoredParagraphElements = {
    "comment": true,
    "supplementary-material": true,
    "fig": true,
    "fig-group": true,
    "table-wrap": true,
    "media": true,
    "inline-graphic": true
  };

  this.acceptedParagraphElements = {
    "boxed-text": {handler: "boxedText"},
    "disp-quote": {handler: "quoteText"},
    "list": { handler: "list" },
    "disp-formula": { handler: "formula" },
  };

  this.inlineParagraphElements = {
//    "inline-graphic": true,
    "inline-formula": true,
    "fn": true
  };

  // Segments children elements of a NLM <p> element
  // into blocks grouping according to following rules:
  // - "text", "inline-graphic", "inline-formula", and annotations
  // - ignore comments, supplementary-materials
  // - others are treated as singles
  this.segmentParagraphElements = function(paragraph) {
    var blocks = [];
    var lastType = "";
    var iterator = new util.dom.ChildNodeIterator(paragraph);

    // first fragment the childNodes into blocks
    while (iterator.hasNext()) {
      var child = iterator.next();
      var type = util.dom.getNodeType(child);

      // ignore some elements
      if (this.ignoredParagraphElements[type]) continue;

      // paragraph block-types such as disp-formula
      // i.e they are allowed within a paragraph, but
      // we pull them out on the top level
      if (this.acceptedParagraphElements[type]) {
        blocks.push(_.extend({node: child}, this.acceptedParagraphElements[type]));
      }
      // paragraph elements
      //if (type === "text" || this.isAnnotation(type) || this.inlineParagraphElements[type]) {
      else {
        if (lastType !== "paragraph") {
          blocks.push({ handler: "paragraph", nodes: [] });
          lastType = "paragraph";
        }
        _.last(blocks).nodes.push(child);
        continue;
      }

      lastType = type;
    }
    return blocks;
  };


  // A 'paragraph' is given a '<p>' tag
  // An NLM <p> can contain nested elements that are represented flattened in a Substance.Article
  // Hence, this function returns an array of nodes
  this.paragraphGroup = function(state, paragraph) {
    var nodes = [];

    // Note: there are some elements in the NLM paragraph allowed
    // which are flattened here. To simplify further processing we
    // segment the children of the paragraph elements in blocks
    var blocks = this.segmentParagraphElements(paragraph);

    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      var node;
      if (block.handler === "paragraph") {
        node = this.paragraph(state, block.nodes);
        if (node) node.source_id = paragraph.getAttribute("id");
      } else {
        node = this[block.handler](state, block.node);
      }
      if (node) nodes.push(node);
    }

    return nodes;
  };

  // DEPRECATED: using this handler for <p> elements is
  // deprecated, as in JATS <p> can contain certain block-level
  // elements. Better use this.paragraphGroup in cases where you
  // convert <p> elements.
  // TODO: we should refactor this and make it a 'private' helper
  this.paragraph = function(state, children) {
    var doc = state.doc;

    // Reset whitespace handling at the beginning of a paragraph.
    // I.e., whitespaces at the beginning will be removed rigorously.
    state.skipWS = true;

    var node = {
      id: state.nextId("paragraph"),
      type: "paragraph",
      children: null
    };
    var nodes = [];

    var iterator = new util.dom.ChildNodeIterator(children);
    while (iterator.hasNext()) {
      var child = iterator.next();
      var type = util.dom.getNodeType(child);

      // annotated text node
      if (type === "text" || this.isAnnotation(type) || this.isInlineNode(type)) {
        var textNode = {
          id: state.nextId("text"),
          type: "text",
          content: null
        };
        // pushing information to the stack so that annotations can be created appropriately
        state.stack.push({
          path: [textNode.id, "content"]
        });
        // Note: this will consume as many textish elements (text and annotations)
        // but will return when hitting the first un-textish element.
        // In that case, the iterator will still have more elements
        // and the loop is continued
        // Before descending, we reset the iterator to provide the current element again.
        // TODO: We have disabled the described behavior as it seems
        // worse to break automatically on unknown inline tags,
        // than to render plain text, as it results in data loss.
        // If you find a situation where you want to flatten structure
        // found within a paragraph, use this.acceptedParagraphElements instead
        // which is used in a preparation step before converting paragraphs.
        var annotatedText = this._annotatedText(state, iterator.back(), { offset: 0, breakOnUnknown: false });

        // Ignore empty paragraphs
        if (annotatedText.length > 0) {
          textNode.content = annotatedText;
          doc.create(textNode);
          nodes.push(textNode);
        }

        // popping the stack
        state.stack.pop();
      }
      // inline image node
      else if (type === "inline-graphic") {
        var url = child.getAttribute("xlink:href");
        var img = {
          id: state.nextId("image"),
          type: "image",
          url: this.resolveURL(state, url)
        };
        doc.create(img);
        nodes.push(img);
      }
      else if (type === "inline-formula") {
        var formula = this.formula(state, child, "inline");
        if (formula) {
          nodes.push(formula);
        }
      }
    }

    // return if there is no content
    if (nodes.length === 0) return null;

    // FIXME: ATM we can not unwrap single nodes, as there is code relying
    // on getting a paragraph with children
    // // if there is only a single node, do not create a paragraph around it
    // if (nodes.length === 1) {
    //   return nodes[0];
    // } else {
    //   node.children = _.map(nodes, function(n) { return n.id; } );
    //   doc.create(node);
    //   return node;
    // }

    node.children = _.map(nodes, function(n) { return n.id; } );
    doc.create(node);
    return node;
  };

  // List type
  // --------

  this.listTypesMap = {
    bullet: 'bulleted',
    ordered: 'ordered',
    order: 'ordered',
    simple: 'simple',
  };

  this.list = function(state, list) {
    var doc = state.doc;

    var listNode = {
      "id": state.nextId("list"),
      "source_id": list.getAttribute("id"),
      "type": "list",
      "items": [],
      "list_type": "simple",
      "labels": []
    };

    var listType = this.listTypesMap[list.getAttribute("list-type")];
    if ( listType ) {
      listNode.list_type = listType;
    }

    var listItems = this.selectDirectChildren(list, "list-item");
    for (var i = 0; i < listItems.length; i++) {
      var listItem = listItems[i];

      var label = this.selectDirectChild(listItem, "label");
      listNode.labels.push(label ? label.textContent : null );

      // Note: we do not care much about what is served as items
      // However, we do not have complex nodes on paragraph level
      // They will be extract as sibling items
      var nodes = this.bodyNodes(state, util.dom.getChildren(listItem), {ignore: ["label"]});
      for (var j = 0; j < nodes.length; j++) {
        if (j > 0) {
          // length of labels have to be same as length of nodes, otherwise labels are shown wrong
          listNode.labels.push(null);
        }
        listNode.items.push(nodes[j].id);
      }
    }

    doc.create(listNode);
    return listNode;
  };


  // <fig-group>

  this.figureGroupChildNodes = function(state, figureGroup) {
    // ignore title in the caption
    var prevCaptionHandler = this._bodyNodes["caption"];
    this._bodyNodes["caption"] = function(state, child) {
      return this.caption(state, child, true);
    };

    var childNodes = this.bodyNodes(state, util.dom.getChildren(figureGroup));

    this._bodyNodes["caption"] = prevCaptionHandler;

    return childNodes;
  };

  this.figureGroup = function(state, figureGroup) {
    var doc = state.doc;

    var childNodes = this.figureGroupChildNodes(state, figureGroup);

    var figureGroupNode = {
      type: 'figure_group',
      id: state.nextId('figure_group'),
      source_id: figureGroup.getAttribute('id'),
      position: 'float',
      orientation: 'portrait',
      caption: null,
      children: _.pluck(childNodes, 'id'),
      referenced: state.xmlDoc.querySelector('xref[rid='+ figureGroup.getAttribute('id') +']')?true:false,
    };

    var label = figureGroup.querySelector("label");
    if ( label && label.parentNode === figureGroup ) {
      figureGroupNode.label = this.annotatedText(state, label, [figureGroupNode.id, 'label']);
    } else {
      label = figureGroup.querySelector('caption title');
      if ( label ) {
        figureGroupNode.label = this.annotatedText(state, label, [figureGroupNode.id, 'label']);
      }
    }

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

    figureGroup._converted = true;
    doc.create(figureGroupNode);

    return figureGroupNode;
  };

  // Handle <fig> element
  // --------
  //

  this.figure = function(state, figure) {
    if ( figure.hasAttribute('fig-type') && figure.getAttribute('fig-type') === 'thumb' )
      return undefined;

    var doc = state.doc;

    // Top level figure node
    var figureNode = {
      "type": "figure",
      "id": state.nextId("figure"),
      "source_id": figure.getAttribute("id"),
      "label": "",
      names: [],
      "urls": [],
      "caption": null,
      referenced:
        (state.xmlDoc.querySelectorAll('fig xref[rid='+ figure.getAttribute('id') +']').length
        <
        state.xmlDoc.querySelectorAll('xref[rid='+ figure.getAttribute('id') +']').length)
          ?true:false,
    };

    var labelEl = figure.querySelector("label");
    if (labelEl) {
      figureNode.label = this.annotatedText(state, labelEl, [figureNode.id, 'label']);
    }

    // Add a caption, if not available then create it
    var caption = figure.querySelector("caption"),
      captionNode;

    if (caption) captionNode = this.caption(state, caption);
    else {
      captionNode = {
        "id": state.nextId("caption"),
        "source_id": "",
        "type": "caption",
        "title": "",
        "children": []
      };

      doc.create(captionNode);
    }

    if (captionNode && !captionNode.children.length) {
      var t1 = {
        "type": "text",
        "id" : state.nextId("text"),
        "content": ""
      };
      doc.create(t1);
      captionNode.children.push(t1.id);
    }

    if (captionNode) figureNode.caption = captionNode.id;

    //
    var attrib = figure.querySelector("attrib");
    if (attrib) {
      figureNode.attrib = attrib.textContent;
    }

    var position = figure.getAttribute('position');
    if (position) {
      figureNode.position = position || '';
    }

    // Lets the configuration patch the figure node properties
    this.enhanceFigure(state, figureNode, figure);
    doc.create(figureNode);

    //HACK: add this information so that we can implement the catch-all converter for figures et al.
    figure._converted = true;

    return figureNode;
  };

  this.verseLine = function(state, verseLine) {
    var doc = state.doc;

    var verseLineNode = {
      type: 'verse_line',
      id: state.nextId('verse_line'),
      text: verseLine.innerHTML
    };

    doc.create(verseLineNode)

    return verseLineNode
  }

  this.verseGroupChildNodes = function(state, verseGroup) {
    var childNodes = this.bodyNodes(state, util.dom.getChildren(verseGroup));

    return childNodes;
  };

  this.verseGroup = function(state, verseGroup) {
    var doc = state.doc;

    var childNodes = this.verseGroupChildNodes(state, verseGroup);

    var verseGroupNode = {
      type: 'verse_group',
      id: state.nextId('verse_group'),
      children: _.pluck(childNodes, 'id'),
    };

    doc.create(verseGroupNode);

    return verseGroupNode;
  };

  // Handle <supplementary-material> element
  // --------
  //
  // eLife Example:
  //
  // <supplementary-material id="SD1-data">
  //   <object-id pub-id-type="doi">10.7554/eLife.00299.013</object-id>
  //   <label>Supplementary file 1.</label>
  //   <caption>
  //     <title>Compilation of the tables and figures (XLS).</title>
  //     <p>This is a static version of the
  //       <ext-link ext-link-type="uri" xlink:href="http://www.vaxgenomics.org/vaxgenomics/" xmlns:xlink="http://www.w3.org/1999/xlink">
  //         Interactive Results Tool</ext-link>, which is also available to download from Zenodo (see major datasets).</p>
  //     <p>
  //       <bold>DOI:</bold>
  //       <ext-link ext-link-type="doi" xlink:href="10.7554/eLife.00299.013">http://dx.doi.org/10.7554/eLife.00299.013</ext-link>
  //     </p>
  //   </caption>
  //   <media mime-subtype="xlsx" mimetype="application" xlink:href="elife00299s001.xlsx"/>
  // </supplementary-material>
  //
  // LB Example:
  //
  // <supplementary-material id="SUP1" xlink:href="2012INTRAVITAL024R-Sup.pdf">
  //   <label>Additional material</label>
  //   <media xlink:href="2012INTRAVITAL024R-Sup.pdf"/>
  // </supplementary-material>

  this.supplement = function(state, supplement) {
    var doc = state.doc;

    //get supplement info
    var label = supplement.querySelector("label");

    var mediaEl = supplement.querySelector("media");
    var url = mediaEl ? mediaEl.getAttribute("xlink:href") : null;
    var doi = supplement.querySelector("object-id[pub-id-type='doi']");
    doi = doi ? "http://dx.doi.org/" + doi.textContent : "";

    //create supplement node using file ids
    var supplementNode = {
      "id": state.nextId("supplement"),
      "source_id": supplement.getAttribute("id"),
      "type": "supplement",
      "label": label ? label.textContent : "",
      "url": url,
      "caption": null
    };

    // Add a caption if available
    var caption = supplement.querySelector("caption");

    if (caption) {
      var captionNode = this.caption(state, caption);
      if (captionNode) supplementNode.caption = captionNode.id;
    }

    // Let config enhance the node
    this.enhanceSupplement(state, supplementNode, supplement);
    doc.create(supplementNode);

    return supplementNode;
  };

  // Used by Figure, Table, Video, Supplement types.
  // --------

  this.caption = function(state, caption, ignoreTitle) {

    ignoreTitle = ignoreTitle || false;

    var doc = state.doc;

    var captionNode = {
      "id": state.nextId("caption"),
      "source_id": caption.getAttribute("id"),
      "type": "caption",
      "title": "",
      "children": []
    };

    // Titles can be annotated, thus delegate to paragraph
    var title = caption.querySelector("title");
    if (title && !ignoreTitle) {
      // Resolve title by delegating to the paragraph
      var node = this.paragraph(state, title);
      if (node) {
        captionNode.title = node.id;
      }
    }

    var children = [];
    var paragraphs = caption.querySelectorAll("p");
    _.each(paragraphs, function(p) {
      // Only consider direct children
      if (p.parentNode !== caption) return;
      var node = this.paragraph(state, p);
      if (node) children.push(node.id);
    }, this);

    captionNode.children = children;
    doc.create(captionNode);

    return captionNode;
  };

  // Example video element
  //
  // <media content-type="glencoe play-in-place height-250 width-310" id="movie1" mime-subtype="mov" mimetype="video" xlink:href="elife00005m001.mov">
  //   <object-id pub-id-type="doi">
  //     10.7554/eLife.00005.013</object-id>
  //   <label>Movie 1.</label>
  //   <caption>
  //     <title>Movement of GFP tag.</title>
  //     <p>
  //       <bold>DOI:</bold>
  //       <ext-link ext-link-type="doi" xlink:href="10.7554/eLife.00005.013">http://dx.doi.org/10.7554/eLife.00005.013</ext-link>
  //     </p>
  //   </caption>
  // </media>

  this.video = function(state, video) {
    var doc = state.doc;

    var label = video.querySelector("label");
    var labelText = label
      ?label.textContent
      :'';

    var id = state.nextId("video");
    var videoNode = {
      "id": id,
      "source_id": video.getAttribute("id"),
      "type": "video",
      "label": labelText,
      "title": "",
      "caption": null,
      "poster": ""
    };

    // Add a caption if available
    var caption = video.querySelector("caption");
    if (caption) {
      var captionNode = this.caption(state, caption);
      if (captionNode) videoNode.caption = captionNode.id;
    }

    this.enhanceVideo(state, videoNode, video);
    doc.create(videoNode);

    return videoNode;
  };

  this.tableWrap = function(state, tableWrap) {
    var doc = state.doc;
    var label = tableWrap.querySelector("label");

    var tableNode = {
      "id": state.nextId("html_table"),
      "source_id": tableWrap.getAttribute("id"),
      "type": "html_table",
      "title": "",
      "label": label ? label.textContent : "Table",
      "content": "",
      "caption": null,
      // Not supported yet ... need examples
      footers: [],
      // doi: "" needed?
      "annotated_text": [],
    };

    // Note: using a DOM div element to create HTML
    var tables = tableWrap.querySelectorAll("table");
    if (tables.length) {
      tableNode.table = this.tablesToTable(state, tables, tableNode);
    }

    var image = tableWrap.querySelector("graphic");
    if (image) {
      tableNode.image = this.resolveURL(state, image.getAttribute('xlink:href'));
    }

    this.extractTableCaption(state, tableNode, tableWrap);

    this.enhanceTable(state, tableNode, tableWrap);
    doc.create(tableNode);
    return tableNode;
  };

  this.extractTableCaption = function(state, tableNode, tableWrap) {
    // Add a caption if available
    var caption = tableWrap.querySelector("caption");
    if (caption) {
      var captionNode = this.caption(state, caption);
      if (captionNode) tableNode.caption = captionNode.id;
    } else {
      console.error('caption node not found for', tableWrap);
    }
  };

  this.tablesToTable = function(state, tableEls, tableNode) {
    var table;
    tableEls.forEach(function(tableEl){
       var t = this.tableToTable(state, tableEl, [tableNode.id, 'annotated_text', 0], tableNode.annotated_text);
       var nodes = t.childrens || [];
       table = {
          name: table ? table.name : t.name,
          attributes: table ? table.attributes : t.attributes,
          childrens : table ? table.childrens.concat(nodes) : nodes
       }
    }, this);
    return table;
  }

  this.tableToTable = function(state, el, path, at) {
    var this_ = this;

    if( el.nodeName === 'td' || el.nodeName === 'th') {
      var path = path.slice();
      path[2] = at.length;
      at.push(this.annotatedText(state, el, path));
      return {
        name: el.nodeName,
        attributes: this.attributes(el),
      };
    } else {
      return {
        name: el.nodeName,
        attributes: this.attributes(el),
        childrens: _.map(
          _.filter(el.childNodes, function(el) {
            return el.nodeType !== Node.TEXT_NODE;
          }),
          function(el){
          return this_.tableToTable(state, el, path, at);
        }),
      };
    }
  };

  this.attributes = function(el) {
    return _.map(el.attributes, function(a){
      return { name: a.nodeName, value: a.nodeValue };
    });
  };

  // Formula Node Type
  // --------

  this._getFormulaData = function(state, formulaElement) {
    var result = [];
    for (var child = formulaElement.firstElementChild; child; child = child.nextElementSibling) {
      var type = util.dom.getNodeType(child);
      switch (type) {
        case "graphic":
        case "inline-graphic":
          result.push({
            format: 'image',
            data: this.resolveURL(state, child.getAttribute('xlink:href'))
          });
          break;
        case "svg":
          result.push({
            format: "svg",
            data: this.toHtml(child)
          });
          break;
        case "mml:math":
        case "math":
          result.push({
            format: "mathml",
            data: this.mmlToHtmlString(child)
          });
          break;
        case "tex-math":
          result.push({
            format: "latex",
            data: child.textContent
          });
          break;
        case "label":
          // Skipping - is handled in this.formula()
          break;
        default:
          console.error('Unsupported formula element of type ' + type);
      }
    }
    return result;
  };

  this.formula = function(state, formulaElement, inline) {
    var doc = state.doc;
    var formulaNode = {
      id: state.nextId("formula"),
      source_id: formulaElement.getAttribute("id"),
      type: "formula",
      label: "",
      inline: !!inline,
      data: [],
      format: [],
    };
    var label = formulaElement.querySelector("label");
    if (label) formulaNode.label = label.textContent;
    var formulaData = this._getFormulaData(state, formulaElement, inline);
    for (var i = 0; i < formulaData.length; i++) {
      formulaNode.format.push(formulaData[i].format);
      formulaNode.data.push(formulaData[i].data);
    }
    doc.create(formulaNode);
    return formulaNode;
  };

  this.footnote = function(state, footnoteElement, tag) {
    var doc = state.doc;
    var fnId = state.nextId('fn');
    var fnRef = state.nextId('footnote_reference');
    var footnote = {
      type: 'footnote',
      id: fnId,
      source_id: footnoteElement.getAttribute("id"),
      label: '',
      children: [],
      tag: tag ? tag : "",
      reference_id: fnRef
    };
    var children = footnoteElement.children;
    var i = 0;
    if (children[i].tagName.toLowerCase() === 'label') {
      footnote.label = this.annotatedText(state, children[i], [footnote.id, 'label']);
      i++;
    } else {
      var firstXref = state.xmlDoc.querySelector('xref[ref-type=table-fn][rid=' + footnote.source_id + ']');
      if ( firstXref ) {
        footnote.label = firstXref.textContent;
      }
    }

    footnote.children = [];
    for (; i<children.length; i++) {
      var nodes = this.paragraphGroup(state, children[i]);
      Array.prototype.push.apply(footnote.children, _.pluck(nodes, 'id'));
    }

    doc.create(footnote);

    // leave a trace for the catch-all converter
    // to know that this has been converted already
    footnoteElement.__converted__ = true;
    return footnote;
  };

  // Citations
  // ---------

  this.citationTypes = {
    "mixed-citation": function(state, ref, citation) {
      return this.mixedCitation(state, ref, citation);
    },
    "element-citation": function(state, ref, citation) {
      return this.elementCitation(state, ref, citation);
    },
  };

  this.refList = function(state, refList) {
    var refs = refList.querySelectorAll("ref");
    for (var i = 0; i < refs.length; i++) {
      this.ref(state, refs[i]);
    }
  };

  this.ref = function(state, ref) {
    var children = util.dom.getChildren(ref);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var type = util.dom.getNodeType(child);

      if (this.citationTypes[type]) {
        var citation = this.citationTypes[type].call(this, state, ref, child);
        citation.referenced = state.xmlDoc.querySelector('xref[rid='+ ref.getAttribute('id') +']')?true:false;
      } else if (type === "label") {
        // skip the label here...
        // TODO: could we do something useful with it?
      } else {
        console.error("Not supported in 'ref': ", type);
      }
    }
  };

  // Citation
  // ------------------
  // NLM input example
  //
  // <element-citation publication-type="journal" publication-format="print">
  // <name><surname>Llanos De La Torre Quiralte</surname>
  // <given-names>M</given-names></name>
  // <name><surname>Garijo Ayestaran</surname>
  // <given-names>M</given-names></name>
  // <name><surname>Poch Olive</surname>
  // <given-names>ML</given-names></name>
  // <article-title xml:lang="es">Evolucion de la mortalidad
  // infantil de La Rioja (1980-1998)</article-title>
  // <trans-title xml:lang="en">Evolution of the infant
  // mortality rate in la Rioja in Spain
  // (1980-1998)</trans-title>
  // <source>An Esp Pediatr</source>
  // <year>2001</year>
  // <month>Nov</month>
  // <volume>55</volume>
  // <issue>5</issue>
  // <fpage>413</fpage>
  // <lpage>420</lpage>
  // <comment>Figura 3, Tendencia de mortalidad infantil
  // [Figure 3, Trends in infant mortality]; p. 418.
  // Spanish</comment>
  // </element-citation>

  // TODO: is implemented naively, should be implemented considering the NLM spec
  this.elementCitation = function(state, ref, citation) {
    var doc = state.doc;
    var citationNode;
    var i;

    var id = state.nextId("article_citation");

    var personGroup = citation.querySelector("person-group");

    if (personGroup) {

      citationNode = {
        "id": id,
        "source_id": ref.getAttribute("id"),
        "type": "citation",
        "title": "N/A",
        "article_title": "N/A",
        "label": "",
        "authors": [],
        "doi": "",
        "source": "",
        "volume": "",
        "fpage": "",
        "lpage": "",
        "citation_urls": []
      };

      var nameElements = personGroup.querySelectorAll("name");
      for (i = 0; i < nameElements.length; i++) {
        var name = this.getName(nameElements[i]);
        if (name) citationNode.authors.push(name);
      }

      // Consider collab elements (treat them as authors)
      var collabElements = personGroup.querySelectorAll("collab");
      for (i = 0; i < collabElements.length; i++) {
        citationNode.authors.push(collabElements[i].textContent);
      }

      var source = citation.querySelector("source");
      if (source) citationNode.source = source.textContent;

      var articleTitle = citation.querySelector("article-title");
      if (articleTitle) {
        citationNode.title = this.annotatedText(state, articleTitle, [id, 'title']);
        citationNode.article_title = citationNode.title;
      } else {
        var comment = citation.querySelector("comment");
        if (comment) {
          citationNode.title = this.annotatedText(state, comment, [id, 'title']);
        } else {
          // 3rd fallback -> use source
          if (source) {
            citationNode.title = this.annotatedText(state, source, [id, 'title']);
          } else {
            console.error("FIXME: this citation has no title", citation);
          }
        }
      }

      var volume = citation.querySelector("volume");
      if (volume) citationNode.volume = volume.textContent;

      var publisherLoc = citation.querySelector("publisher-loc");
      if (publisherLoc) citationNode.publisher_location = publisherLoc.textContent;

      var publisherName = citation.querySelector("publisher-name");
      if (publisherName) citationNode.publisher_name = publisherName.textContent;

      var fpage = citation.querySelector("fpage");
      if (fpage) citationNode.fpage = fpage.textContent;

      var lpage = citation.querySelector("lpage");
      if (lpage) citationNode.lpage = lpage.textContent;

      // Note: the label is child of 'ref'
      var label = ref.querySelector("label");
      if(label) citationNode.label = label.textContent;

      var doi = citation.querySelector("pub-id[pub-id-type='doi'], ext-link[ext-link-type='doi']");
      if(doi) citationNode.doi = "http://dx.doi.org/" + doi.textContent;

      var year = citation.querySelector("year");
      if (year) citationNode.year = year.textContent;

      // relaxed date tags processing
      var relaxedDate;
      if (citationNode.year) relaxedDate = citationNode.year;

      var month = citation.querySelector("month");
      if (month) relaxedDate += ' ' + month.textContent;

      var day = citation.querySelector("day");
      if (day) relaxedDate += ' ' + day.textContent;

      citationNode.relaxed_date = relaxedDate;

      doc.create(citationNode);
      doc.show("citations", id);

      return citationNode;

    } else {
      console.error("FIXME: there is one of those 'element-citation' without any structure. Skipping ...", citation);
      return;
    }
  };

this.mixedCitation = function(state, ref, citation) {
    var doc = state.doc;
    var i;

    var id = state.nextId("article_citation");

    var citationNode = {
      "id": id,
      "source_id": ref.getAttribute("id"),
      "type": "citation",
      "title": "N/A",
      "article_title": "N/A",
      "label": "",
      "authors": [],
      "doi": "",
      "source": "",
      "volume": "",
      "fpage": "",
      "lpage": "",
      "citation_urls": []
    };

    var nameElements = citation.querySelectorAll("string-name");
    for (i = 0; i < nameElements.length; i++) {
      var name = this.getName(nameElements[i]);
      if (name) citationNode.authors.push(name);
    }

    // Consider collab elements (treat them as authors)
    var collabElements = citation.querySelectorAll("collab");
    for (i = 0; i < collabElements.length; i++) {
      citationNode.authors.push(collabElements[i].textContent);
    }

    var source = citation.querySelector("source");
    if (source) citationNode.source = source.textContent;

    var articleTitle = citation.querySelector("article-title");
    if (articleTitle) {
      citationNode.article_title = this.annotatedText(state, articleTitle, [id, 'title']);
      citationNode.title = citationNode.article_title;
    } else {
      var comment = citation.querySelector("comment");
      if (comment) {
        citationNode.title = this.annotatedText(state, comment, [id, 'title']);
      } else {
        // 3rd fallback -> use source
        if (source) {
          citationNode.title = this.annotatedText(state, source, [id, 'title']);
        }
      }
    }

    var volume = citation.querySelector("volume");
    if (volume) citationNode.volume = volume.textContent;

    var publisherLoc = citation.querySelector("publisher-loc");
    if (publisherLoc) citationNode.publisher_location = publisherLoc.textContent;

    var publisherName = citation.querySelector("publisher-name");
    if (publisherName) citationNode.publisher_name = publisherName.textContent;

    var fpage = citation.querySelector("fpage");
    if (fpage) citationNode.fpage = fpage.textContent;

    var lpage = citation.querySelector("lpage");
    if (lpage) citationNode.lpage = lpage.textContent;

    // Note: the label is child of 'ref'
    var label = ref.querySelector("label");
    if(label) citationNode.label = label.textContent;

    var doi = citation.querySelector("pub-id[pub-id-type='doi'], ext-link[ext-link-type='doi']");
    if(doi) citationNode.doi = "http://dx.doi.org/" + doi.textContent;

    var jbjs = citation.querySelector("pub-id[pub-id-type='jbjs']");
    if(jbjs) {
      citationNode.jbjs = jbjs.textContent;
      citationNode.citation_urls.push({
        url: jbjs.getAttribute('xlink:href'),
        name: citationNode.jbjs
      });
    }

    var uri = citation.querySelector('ext-link[ext-link-type=uri]');
    if( uri ) citationNode.citation_urls.push({
      url: uri.getAttribute('xlink:href'),
      name: uri.getAttribute('xlink:href')
    });

    var pmid = citation.querySelector("pub-id[pub-id-type='pmid']");
    if(pmid) citationNode.pmid = pmid.textContent;

    var year = citation.querySelector("year");
    if (year) citationNode.year = year.textContent;

    // relaxed date tags processing
    var relaxedDate;
    if (citationNode.year) relaxedDate = citationNode.year;

    var month = citation.querySelector("month");
    if (month) relaxedDate += ' ' + month.textContent;

    var day = citation.querySelector("day");
    if (day) relaxedDate += ' ' + day.textContent;

    citationNode.relaxed_date = relaxedDate;

    citationNode.relaxed_text = this.annotatedText(state, citation, [id, 'relaxed_text'], { ignore: ['pub-id']});

    doc.create(citationNode);
    doc.show("citations", id);

    return citationNode;
  };

  this.data = function(node) {
    var data = '';
    for (var i = 0; i < node.childNodes.length; ++i) {
      if ( node.childNodes[i].nodeType === 3 && node.childNodes[i].textContent.length > 12 ) {
        data += node.childNodes[i].textContent;
      }
    }
    return data;
  };

  // Article.Back
  // --------

  this.back = function(state, back) {
    var appGroups = back.querySelectorAll('app-group');

    if (appGroups && appGroups.length > 0) {
      _.each(appGroups, function(appGroup) {
        this.appGroup(state, appGroup);
      }.bind(this));
    } else {
      // HACK: We treat <back> element as app-group, sine there
      // are docs that wrongly put <app> elements into the back
      // element directly.
      this.appGroup(state, back);
    }
  };

  this.appGroup = function(state, appGroup) {
    var apps = appGroup.querySelectorAll('app');
    if(apps.length===0) return;

    var doc = state.doc;
    var title = appGroup.querySelector('title');
    if (!title) {
      console.error("FIXME: every app should have a title", this.toHtml(title));
    }

    var headingId =state.nextId("heading");
    // Insert top level element for Appendix
    var heading = doc.create({
      "type" : "heading",
      "id" : headingId,
      "level" : 1,
      "content" : title ? this.annotatedText(state, title, [headingId, "content"]) : "Appendix"
    });

    this.show(state, [heading]);
    _.each(apps, function(app) {
      state.sectionLevel = 2;
      this.app(state, app);
    }.bind(this));
  };

  this.app = function(state, app) {
    var doc = state.doc;
    var nodes = [];
    var title = app.querySelector('title');
    if (!title) {
      console.error("FIXME: every app should have a title", this.toHtml(title));
    }

    var headingId = state.nextId("heading");
    var heading = {
      "type" : "heading",
      "id" : headingId,
      "level" : 2,
      "content": title ? this.annotatedText(state, title, [headingId, "content"]) : ""
    };
    var headingNode = doc.create(heading);
    nodes.push(headingNode);

    // There may be multiple paragraphs per ack element
    var pars = this.bodyNodes(state, util.dom.getChildren(app), {
      ignore: ["title", "label", "ref-list"]
    });
    _.each(pars, function(par) {
      nodes.push(par);
    });
    this.show(state, nodes);
  };




  // Annotations
  // -----------

  this.createAnnotation = function(state, el, start, end) {
    var type = el.tagName.toLowerCase();

    // do not create an annotaiton if there is no range or no xref
    if (type!='xref' && start === end) return;

    var anno = {
      type: "annotation",
      path: _.last(state.stack).path,
      range: [start, end],
    };
    this.addAnnotationData(state, anno, el, type);
    this.enhanceAnnotationData(state, anno, el, type);

    // assign an id after the type has been extracted to be able to create typed ids
    anno.id = state.nextId(anno.type);
    state.annotations.push(anno);
  };

  // Called for annotation types registered in this._annotationTypes
  this.addAnnotationData = function(state, anno, el, type) {
    anno.type = this._annotationTypes[type] || "annotation";
    if (type === 'xref') {
      this.addAnnotationDataForXref(state, anno, el);
    } else if (type === "ext-link" || type === "uri") {
      anno.url = el.getAttribute("xlink:href");
      // Add 'http://' to URIs without a protocol, such as 'www.google.com'
      // Except: Url starts with a slash, then we consider them relative
      var extLinkType = el.getAttribute('ext-link-type') || '';
      if ((type === "uri" || extLinkType.toLowerCase() === 'uri') && !/^\w+:\/\//.exec(anno.url) && !/^\//.exec(anno.url)) {
        anno.url = 'http://' + anno.url;
      } else if (extLinkType.toLowerCase() === 'doi') {
        anno.url = ["http://dx.doi.org/", anno.url].join("");
      }
    } else if (type === "email") {
      anno.url = "mailto:" + el.textContent.trim();
    } else if (type === 'inline-graphic') {
      anno.url = el.getAttribute("xlink:href");
    } else if (type === 'inline-formula') {
      var formula = this.formula(state, el, "inline");
      anno.target = formula.id;
    } else if (anno.type === 'custom_annotation') {
      anno.name = type;
    }
  };

  this.addAnnotationDataForXref = function(state, anno, el) {
    var refType = el.getAttribute("ref-type");
    var sourceId = el.getAttribute("rid");
    // Default reference is a cross_reference
    anno.type = this._refTypeMapping[refType] || "cross_reference";
    if (sourceId) anno.target = sourceId;
  };

  this.createInlineNode = function(state, el, start) {
    var inlineNode = {
      type: "inline-node",
      path: _.last(state.stack).path,
      range: [start, start+1],
    };

    this.addInlineNodeData(state, inlineNode, el);
    this.enhanceInlineNodeData(state, inlineNode, el);

    // assign an id after the type has been extracted to be able to create typed ids
    inlineNode.id = state.nextId(inlineNode.type);

    state.annotations.push(inlineNode);
  };

  this.addInlineNodeData = function(state, inlineNode, el) {
    /*jshint unused: false*/
    var tagName = el.tagName.toLowerCase();
    switch(tagName) {
      case 'fn':
        // when we hit a <fn> inline, we will create a footnote-reference
        var footnote = this.footnote(state, el);
        inlineNode.type = 'footnote_reference';
        inlineNode.target = footnote.id;
        // We generate footnote references if we find an inline fn element
        inlineNode.generated = true;
        break;
    }
  };

  this.enhanceInlineNodeData = function(state, inlineNode, el, tagName) {
    /*jshint unused: false*/
  };

  // Parse annotated text
  // --------------------
  // Make sure you call this method only for nodes where `this.isParagraphish(node) === true`
  //
  this.annotatedText = function(state, node, path, options) {
    options = options || {};
    state.stack.push({
      path: path,
      ignore: options.ignore
    });
    var childIterator = new util.dom.ChildNodeIterator(node);
    var text = this._annotatedText(state, childIterator, options);
    state.stack.pop();
    return text;
  };

  // Internal function for parsing annotated text
  // --------------------------------------------
  // As annotations are nested this is a bit more involved and meant for
  // internal use only.
  //
  this._annotatedText = function(state, iterator, options) {
    var plainText = "";
    var linebreak = '<br>';
    var bulletChar = '\u2022';

    var charPos = (options.offset === undefined) ? 0 : options.offset;
    var nested = !!options.nested;
    var breakOnUnknown = !!options.breakOnUnknown;
    var listType = (options.list_type === undefined) ? '' : options.list_type;

    while(iterator.hasNext()) {
      var el = iterator.next();
      // Plain text nodes...
      if (el.nodeType === Node.TEXT_NODE) {
        var text = state.acceptText(el.textContent);
        plainText += text;
        charPos += text.length;
      }
      // Annotations...
      else {
        var annotatedText;
        var type = util.dom.getNodeType(el);
        if (this.isAnnotation(type)) {
          if (state.top().ignore.indexOf(type) < 0) {
            var start = charPos;
            if (this._annotationTextHandler[type]) {
              annotatedText = this._annotationTextHandler[type].call(this, state, el, type, charPos);
            } else {
              annotatedText = this._getAnnotationText(state, el, type, charPos);
            }
            plainText += annotatedText;
            charPos += annotatedText.length;
            if (!state.ignoreAnnotations) {
              this.createAnnotation(state, el, start, charPos);
            }
          }
        }
        else if (this.isInlineNode(type)) {
          plainText += " ";
          this.createInlineNode(state, el, charPos);
        }
        // Unsupported...
        else if (!breakOnUnknown) {
          if (state.top().ignore.indexOf(type) < 0) {
            // assume that table stuff goes here
            if (el.nodeName === 'list') {
              var type = el.getAttribute('list-type');
              if (type) {
                options['list_type'] = type;
                if (type === 'order') {
                  options['list_order'] = 1;
                }
              }
            }

            var prefix = '';
            if (el.nodeName === 'list-item') {
              var withLabel = !!this.selectDirectChild(el, 'label');
              if (listType === 'bullet' && !withLabel) {
                prefix = bulletChar;
              }
              if (listType === 'order' && options.list_order) {
                if (!withLabel) {
                  prefix = options.list_order + '.';
                }
                options.list_order++;
              }
            }
            if (prefix !== '') {
              prefix += ' ';
            }

            annotatedText = this._getAnnotationText(state, el, type, charPos, options);

            var suffix = '';
            if (el.nodeName === 'list-item') {
              prefix = linebreak + prefix;
            }
            if (el.parentNode.nodeName === 'list-item' &&  el.nodeName === 'label') {
              suffix = ' ';
            }

            annotatedText = prefix + annotatedText + suffix;
            plainText += annotatedText;
            charPos += annotatedText.length;
          }
        } else {
          if (nested) {
            console.error("Node not supported in annoted text: " + type +"\n"+el.outerHTML);
          }
          else {
            // on paragraph level other elements can break a text block
            // we shift back the position and finish this call
            iterator.back();
            break;
          }
        }
      }
    }
    return plainText;
  };

  // A place to register handlers to override how the text of an annotation is created.
  // The default implementation is this._getAnnotationText() which extracts the plain text and creates
  // nested annotations if necessary.
  // Examples for other implementations:
  //   - links: the label of a link may be shortened in certain cases
  //   - inline elements: we model inline elements by a pair of annotation and a content node, and we create a custom label.

  this._annotationTextHandler = {};

  this._getAnnotationText = function(state, el, type, charPos, options) {
    // recurse into the annotation element to collect nested annotations
    // and the contained plain text
    var childIterator = new util.dom.ChildNodeIterator(el);
    options = Object.assign({}, options || {}, { offset: charPos, nested: true });
    var annotatedText = this._annotatedText(state, childIterator, options);
    return annotatedText;
  };

  this._annotationTextHandler['ext-link'] = function(state, el, type, charPos) {
    var annotatedText = this._getAnnotationText(state, el, type, charPos);
    // Shorten label for URL links (i.e. if label === url )
    if (false && type === 'ext-link' && el.getAttribute('xlink:href') === annotatedText.trim()) {
      annotatedText = this.shortenLinkLabel(state, annotatedText);
    }
    return annotatedText;
  };

  this._annotationTextHandler['inline-formula'] = function(state) {
    return state.acceptText("{{inline-formula}}");
  };

  this._annotationTextHandler['string-name'] = function(state, el) {
    return _.reduce(el.childNodes, function(str, node) {
      return str + ' ' + node.textContent;
    }, '');
  };

  this._annotationTextHandler['break'] = function(state) {
    return ' ';
  };

  this.shortenLinkLabel = function(state, linkLabel) {
    var LINK_MAX_LENGTH = 50;
    var MARGIN = 10;
    // The strategy is preferably to shorten the fragment after the host part, preferring the tail.
    // If this is not possible, both parts are shortened.
    if (linkLabel.length > LINK_MAX_LENGTH) {
      var match = /((?:\w+:\/\/)?[\/]?[^\/]+[\/]?)(.*)/.exec(linkLabel);
      if (!match) {
        linkLabel = linkLabel.substring(0, LINK_MAX_LENGTH - MARGIN) + '...' + linkLabel.substring(linkLabel.length - MARGIN - 3);
      } else {
        var host = match[1] || '';
        var tail = match[2] || '';
        if (host.length > LINK_MAX_LENGTH - MARGIN) {
          linkLabel = host.substring(0, LINK_MAX_LENGTH - MARGIN) + '...' + tail.substring(tail.length - MARGIN - 3);
        } else {
          var margin = Math.max(LINK_MAX_LENGTH - host.length - 3, MARGIN - 3);
          linkLabel = host + '...' + tail.substring(tail.length - margin);
        }
      }
    }
    return linkLabel;
  };


  // Configureable methods
  // -----------------
  //

  this.getBaseURL = function(state) {
    // Use xml:base attribute if present
    var baseURL = state.xmlDoc.querySelector("article").getAttribute("xml:base");
    return baseURL || state.options.baseURL;
  };

  this.enhanceArticle = function(state, article) {
    /* jshint unused:false */
    // Noop - override in custom converter
  };

  this.enhanceCover = function(state, node, element) {
    /* jshint unused:false */
    // Noop - override in custom converter
  };

  // Implements resolving of relative urls
  this.enhanceFigure = function(state, node, element) {
    var graphics = element.querySelectorAll("graphic");
    if( graphics.length ) {
      graphics.forEach(function(graphic) {
        var url = graphic.getAttribute("xlink:href").trim();
        if (url) {
          node.names.push(url);
          node.urls.push(this.resolveURL(state, url));
        } else {
          console.log('Image Error: empty image url in "xlink:href" in:');
          console.log(element);
        }
      }, this);
    } else {
      console.log('PL error: fig without graphic');
    }
  };

  this.enhancePublicationInfo = function(converter, state, article) {
    /* jshint unused:false */
    // Noop - override in custom converter
  };

  this.enhanceSupplement = function(state, node, element) {
    /* jshint unused:false */
    // Noop - override in custom converter
  };

  this.enhanceTable = function(state, node, element) {
    /* jshint unused:false */
    // Noop - override in custom converter
  };

  // Default video resolver
  // --------
  //

  this.enhanceVideo = function(state, node, element) {
    // xlink:href example: elife00778v001.mov

    var url = element.getAttribute("xlink:href");
    var name;
    // Just return absolute urls
    if (url.match(/http:/)) {
      var lastdotIdx = url.lastIndexOf(".");
      name = url.substring(0, lastdotIdx);
      node.url = name+".mp4";
      node.url_ogv = name+".ogv";
      node.url_webm = name+".webm";
      node.poster = name+".png";
      return;
    } else {
      var baseURL = this.getBaseURL(state);
      name = url.split(".")[0];
      node.url = baseURL+name+".mp4";
      node.url_ogv = baseURL+name+".ogv";
      node.url_webm = baseURL+name+".webm";
      node.poster = baseURL+name+".png";
    }
  };

  // Default figure url resolver
  // --------
  //
  // For relative urls it uses the same basebath as the source XML

  this.resolveURL = function(state, url) {
    // Just return absolute urls
    if (url.match(/http:/)) return url;
    return [
      state.options.baseURL,
      url
    ].join('');
  };

  this.viewMapping = {
    // "image": "figures",
    "box": "content",
    "supplement": "figures",
    "figure": "figures",
    "figure_group": "figures",
    "html_table": "figures",
    "video": "figures"
  };

  this.enhanceAnnotationData = function(state, anno, element, type) {
    /* jshint unused:false */
  };

  this.showNode = function(state, node) {
    var view = this.viewMapping[node.type] || "content";
    state.doc.show(view, node.id);
  };

};

NlmToLensConverter.State = function(converter, xmlDoc, doc) {
  var self = this;

  // the input xml document
  this.xmlDoc = xmlDoc;

  // the output substance document
  this.doc = doc;

  // keep track of the options
  this.options = converter.options;

  // this.config = new DefaultConfiguration();

  // store annotations to be created here
  // they will be added to the document when everything else is in place
  this.annotations = [];

  // when recursing into sub-nodes it is necessary to keep the stack
  // of processed nodes to be able to associate other things (e.g., annotations) correctly.
  this.stack = [];

  this.sectionLevel = 0;

  // Tracks all available affiliations
  this.affiliations = [];

  // an id generator for different types
  var ids = {};
  this.nextId = function(type) {
    ids[type] = ids[type] || 0;
    ids[type]++;
    return type +"_"+ids[type];
  };

  // store ids here which have been processed already
  this.used = {};

  // Note: it happens that some XML files are edited without considering the meaning of whitespaces
  // to increase readability.
  // This *hack* eliminates multiple whitespaces at the begin and end of textish elements.
  // Tabs and New Lines are eliminated completely. So with this, the preferred way to prettify your XML
  // is to use Tabuators and New Lines. At the same time, it is not possible anymore to have soft breaks within
  // a text.

  var WS_LEFT = /^[ \f\n\r\t\v]+/g;
  var WS_LEFT_ALL = /^[ \f\n\r\t\v]*/g;
  var WS_RIGHT = /[ \f\n\r\t\v]+$/g;
   var WS_ALL = /[ \f\n\r\t\v]+/g;
  // var ALL_WS_NOTSPACE_LEFT = /^[\t\n]+/g;
  // var ALL_WS_NOTSPACE_RIGHT = /[\t\n]+$/g;
  var SPACE = " ";
  var TABS_OR_NL = /[\t\n\r]+/g;

  this.lastChar = "";
  this.skipWS = false;

  this.acceptText = function(text) {
    if (!this.options.TRIM_WHITESPACES) {
      return text;
    }

    // EXPERIMENTAL: drop all 'formatting' white-spaces (e.g., tabs and new lines)
    // (instead of doing so only at the left and right end)
    //text = text.replace(ALL_WS_NOTSPACE_LEFT, "");
    //text = text.replace(ALL_WS_NOTSPACE_RIGHT, "");
    text = text.replace(TABS_OR_NL, "");

    if (this.lastChar === SPACE || this.skipWS) {
      text = text.replace(WS_LEFT_ALL, "");
    } else {
      text = text.replace(WS_LEFT, SPACE);
    }
    // this state is only kept for one call
    this.skipWS = false;

    text = text.replace(WS_RIGHT, SPACE);

    // EXPERIMENTAL: also remove white-space within
    if (this.options.REMOVE_INNER_WS) {
      text = text.replace(WS_ALL, SPACE);
    }

    this.lastChar = text[text.length-1] || this.lastChar;
    return text;
  };

  this.top = function() {
    var top = _.last(self.stack);
    top = top || {};
    top.ignore = top.ignore || [];
    return top;
  };
};

NlmToLensConverter.prototype = new NlmToLensConverter.Prototype();
NlmToLensConverter.prototype.constructor = NlmToLensConverter;

// NlmToLensConverter.DefaultConfiguration = DefaultConfiguration;

NlmToLensConverter.DefaultOptions = {
  TRIM_WHITESPACES: true,
  REMOVE_INNER_WS: true
};

module.exports = NlmToLensConverter;
