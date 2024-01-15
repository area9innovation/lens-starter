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
    "article_type": "string",
    "doi": "string"
  }
};

// Example Related Article
// -----------------
//

RelatedArticle.example = {
  "type": "related_article",
  "id": "related_articles_1",
  "article_type": "companion",
  "doi": "10.2106/JBJS.21.00178"
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
    "article_type": "Related article type",
    "doi": "Doi of the article"
  }
};

RelatedArticle.Prototype = function() {
  this.inline = false;
};

RelatedArticle.Prototype.prototype = Text.prototype;
RelatedArticle.prototype = new RelatedArticle.Prototype();
RelatedArticle.prototype.constructor = RelatedArticle;

Document.Node.defineProperties(RelatedArticle);

module.exports = RelatedArticle;
