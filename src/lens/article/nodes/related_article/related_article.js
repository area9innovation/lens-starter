"use strict";

var Document = require('../../../substance/document');

var RelatedArticle = function(node, document) {
  Document.Node.call(this, node, document);
};

// Type definition
// -----------------
//

RelatedArticle.type = {
  "id": "related_article",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "articles": "array",
  }
};

// Example Related Article
// -----------------
//

RelatedArticle.example = {
  "type": "related_article",
  "id": "related_articles_1",
  "articles": [{
    "article_type": "companion",
    "isDoi": true,
    "doi": "10.2106/JBJS.21.00178",
  }, {
    "article_type": "companion",
    "isDoi": false,
    "volume" : "93",
    "issue" : "9",
    "start_page": "801",
  }]
   
};

// This is used for the auto-generated docs
// -----------------
//


RelatedArticle.description = {
  "name": "Related Article",
  "remarks": [
    "Show related articles."
  ],
  "properties": {
    "articles": "Related articles",
  }
};

RelatedArticle.Prototype = function() {
  // this.inline = false;
};

RelatedArticle.Prototype.prototype = Document.Node.prototype;
RelatedArticle.prototype = new RelatedArticle.Prototype();
RelatedArticle.prototype.constructor = RelatedArticle;

Document.Node.defineProperties(RelatedArticle);

module.exports = RelatedArticle;
