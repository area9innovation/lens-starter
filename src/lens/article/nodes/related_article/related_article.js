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
    "title": "Rare Fungal Infection in Arthritic Knee After Stem Cell...",
    "subtitle": "A Case Report",
    "authors": "Maniar, Adit R; Bhatnagar, Nishit; Mishra, Abhinav; Vinchurkar, Kshitija; Jain, Ditesh",
    "citation": "JBJS Case Connect, 11(2):e20.00354 | May 14, 2021",
    "logo_url": "https://tech.area9innovation.com/jbjs/hub/pages/images/journals/icon/JBJS-icons-CC-Hub-5.svg",
    "heading": "Case Reports",
    "reader_link": "reader.php?rsuite_id=2874499",
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
