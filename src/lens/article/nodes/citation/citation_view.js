"use strict";

var _ = require('underscore');
var $$ = require("../../../substance/application").$$;
var NodeView = require("../node").View;
var ResourceView = require('../../resource_view');

// Lens.Citation.View
// ==========================================================================


var CitationView = function(node, viewFactory, options) {
  NodeView.apply(this, arguments);

  // Mix-in
  ResourceView.call(this, options);

  this.options.focus = this.node.referenced;
};


CitationView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.renderBody = function() {
    var frag = document.createDocumentFragment();
    var node = this.node;

    if ( node.relaxed_text ) {
      var annoView = this.createTextPropertyView([this.node.id, 'relaxed_text']);
      this.content.appendChild(annoView.render().el);

    } else {
      // Add title
      // -------

      var titleView = this.createTextPropertyView([node.id, 'title'], { classes: 'title' });
      frag.appendChild(titleView.render().el);

      // Add Authors
      // -------

      frag.appendChild($$('.authors', {
        html: node.authors.join(', ')
      }));

      // Add Source
      // -------

      var sourceText = "",
          sourceFrag = "",
          pagesFrag = "",
          publisherFrag = "";

      // Hack for handling unstructured citation types and render prettier
      if (node.source && node.volume === '') {
        sourceFrag = node.source;
      } else if (node.source && node.volume) {
        sourceFrag = [node.source, node.volume].join(', ');
      }

      if (node.fpage && node.lpage) {
        pagesFrag = [node.fpage, node.lpage].join('-');
      }

      // Publisher Frag

      var elems = [];

      if (node.publisher_name && node.publisher_location) {
        elems.push(node.publisher_name);
        elems.push(node.publisher_location);
      }

      if (node.relaxed_date) {
        elems.push(node.relaxed_date);
      } else if (node.year) {
        elems.push(node.year);
      }

      publisherFrag = elems.join(', ');

      // Put them together
      sourceText = sourceFrag;

      // Add separator only if there's content already, and more to display
      if (sourceFrag && (pagesFrag || publisherFrag)) {
        sourceText += ": ";
      }

      if (pagesFrag && publisherFrag) {
        sourceText += [publisherFrag, pagesFrag ].join(", ");
      } else {
        // One of them without a separator char
        sourceText += pagesFrag;
        sourceText += publisherFrag;
      }

      frag.appendChild($$('.source', {
        html: sourceText
      }));

      if (node.comment) {
        var commentView = this.createTextView({ path: [node.id, 'comment'], classes: 'comment' });
        frag.appendChild(commentView.render().el);
      }

      this.content.appendChild(frag);
    }

    if (node.jbjs) {
        frag.appendChild($$('span.jbjs', {
          children: [
            $$('a', {
              href: '?' + node.citation_urls[0].url,
              target: '_new',
              text: node.jbjs
            })
          ]
        }));
        this.content.appendChild(frag);
    } else {
      // Add DOI (if available)
      // -------

      if (node.doi) {
        frag.appendChild($$('.doi', {
          children: [
            $$('b', {text: "DOI: "}),
            $$('a', {
              href: node.doi,
              target: "_new",
              text: node.doi
            })
          ]
        }));
      }

      // TODO: Add display citations urls
      // -------
/*

      if (node.citation_urls.length > 0) {
        var citationUrlsEl = $$('.citation-urls');

        _.each(node.citation_urls, function(url) {
          citationUrlsEl.appendChild($$('a.url', {
            href: url.url,
            text: url.name,
            target: "_blank"
          }));
        });

        frag.appendChild(citationUrlsEl);
      }
*/
      if (node.pmid) {
        frag.appendChild($$('span.pubmed', {
          children: [
            $$('a', {
              href: 'https://www.ncbi.nlm.nih.gov/pubmed/?term=' + node.pmid,
              target: '_new',
              text: 'PubMed'
            })
          ]
        }));
      }
      // Google Scholar link
      if (node.article_title && node.article_title != 'N/A' && node.authors.length != 0) {
        var GSUrl = "https://scholar.google.com/scholar?as_vis=1&as_sdt=1,5"; // turn off patents and citations
        var authorLimit = 1; // how many authors to add to GS link, -1 = no limit
        // GS has 256 chars limit for search query box
        var astring = node.authors.reduce(
          function(akk, a, idx) {
            var ok = authorLimit == -1 || idx < authorLimit;
            if (ok && ( akk.len + a.length + 2 + 8) < 256) {
              akk.len += (a.length + 2 + 8); // ' author:'
              akk.astr += ' "' + a + '"';
            }
            return akk;
          },
          {
            astr : '',
            len : node.article_title.length + 12 // 'allintitle: '
          }
        );

        var titleQuery = '&as_q='+ encodeURIComponent(node.article_title) + "&as_occt=title";
        var authorsQuery = (astring.astr) ? "&as_sauthors=" + encodeURIComponent(astring.astr) : '';

        frag.appendChild($$('span.googlescholar', {
          children: [
            $$('a', {
              href: GSUrl + titleQuery + authorsQuery,
              target: '_new',
              text: 'GoogleScholar'
            })
          ]
        }));
      }

      this.content.appendChild(frag);
    }
  };
};

CitationView.Prototype.prototype = NodeView.prototype;
CitationView.prototype = new CitationView.Prototype();
CitationView.prototype.constructor = CitationView;

module.exports = CitationView;
