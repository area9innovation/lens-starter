"use strict";

var _ = require("underscore");
var NodeView = require("../node").View;
var $$ = require("../../../substance/application").$$;
var articleUtil = require("../../article_util");

// Lens.Cover.View
// ==========================================================================

var CoverView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);
};

CoverView.Prototype = function() {

  // Render it
  // --------
  //
  // .content
  //   video
  //     source
  //   .title
  //   .caption
  //   .doi

  this.render = function() {
    dev.trace("render - Cover");
    NodeView.prototype.render.call(this);

    var node = this.node;
    var doc = this.node.document;
    var pubInfo = doc.get('publication_info');


    // Title View
    // --------------
    //

    var titleView = this.createTextPropertyView(['document', 'title'], { classes: 'title', elementType: 'div' });
    this.content.appendChild(titleView.render().el);
    this.content.appendChild(titleView.render().el);

    var subtitle = this.node.getSubtitle();
    if( subtitle ) {
      var subtitleView = this.createTextPropertyView(['document', 'subtitle', 'text'], { classes: 'subtitle', elementType: 'div' });
      var subtitleEl = subtitleView.render().el;
      this.content.appendChild(subtitleEl);
      if (subtitle.notes.length > 0) {
        this.content.appendChild($$('.footnotes', {
          children: _.map(subtitle.notes, function(fnId) {
            var fn = doc.getNodeBySourceId(fnId);
            if (fn && fn.label.length > 0 ) {
              subtitleEl.appendChild($$('span.label .annotation .cross_reference .subtitle',
                {'data-id': fn.properties.reference_id, text: fn.label}
              ));
            }
            return $$('span', {text: ''});
          })
        }))
      }
    }

    // Render Authors
    // --------------
    //

    var authors = $$('.authors', {
      children: _.map(node.getAuthors(), function(authorPara) {
        var paraView = this.viewFactory.createView(authorPara);
        var paraEl = paraView.render().el;
        this.content.appendChild(paraEl);
        return paraEl;
      }, this)
    });

// hack : on-behalf-of is a fake author now so it is on the author list, so no need to add it here
/*
    authors.appendChild($$('.content-node.text.plain', {
      children: [
        $$('.content', {text: this.node.document.on_behalf_of})
      ]
    }));
*/
    this.content.appendChild(authors);

    if (pubInfo) {
      var pubDate = pubInfo.published_on;
      var articleType = pubInfo.article_type;
      if (pubDate) {
        var items = [articleUtil.formatDate(pubDate)];

        if (articleType) {
          if (pubInfo.article_type_link) {
            var linkData = pubInfo.getArticleTypeLink()
            items.unshift('<a href="' + linkData.url + '">' + linkData.name + '</a>')
          } else {
            items.unshift(articleType)
          }
        }
      }
    }

    // Render Links
    // --------------
    //

    if (pubInfo && pubInfo.links.length > 0) {
      var linksEl = $$('.links');
      _.each(pubInfo.links, function(link) {
        if (link.type === "json" && link.url === "") {
          // Make downloadable JSON
          var json = JSON.stringify(this.node.document.toJSON(), null, '  ');
          var bb = new Blob([json], {type: "application/json"});

          linksEl.appendChild($$('a.json', {
            href: window.URL ? window.URL.createObjectURL(bb) : "#",
            html: '<i class="fa fa-external-link-square"></i> '+link.name,
            target: '_blank'
          }));

        } else {
          linksEl.appendChild($$('a.' + link.type, {
            href: link.url,
            html: '<i class="fa fa-external-link-square"></i> ' + link.name,
            target: '_blank'
          }));
        }
      }, this);

      this.content.appendChild(linksEl);
    }

    return this;
  };
};

CoverView.Prototype.prototype = NodeView.prototype;
CoverView.prototype = new CoverView.Prototype();

module.exports = CoverView;
