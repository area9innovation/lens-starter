"use strict";

var Document = require('../../../substance/document');

var RelatedArticles = function(node, document) {
  Document.Node.call(this, node, document);
};

// Type definition
// -----------------
//

RelatedArticles.type = {
  "id": "related_articles",
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

RelatedArticles.example = {
  "type": "related_articles",
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


RelatedArticles.description = {
  "name": "Related Article",
  "remarks": [
    "Show related articles."
  ],
  "properties": {
    "articles": "Related articles",
  }
};

RelatedArticles.Prototype = function() {
  // this.inline = false;
};

RelatedArticles.Prototype.prototype = Document.Node.prototype;
RelatedArticles.prototype = new RelatedArticles.Prototype();
RelatedArticles.prototype.constructor = RelatedArticles;

Document.Node.defineProperties(RelatedArticles);

module.exports = RelatedArticles;
