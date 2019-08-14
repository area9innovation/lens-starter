"use strict";

var Document = require('lens/substance/document');

var Infographics = function(node, document) {
  Document.Composite.call(this, node, document);
};


Infographics.type = {
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "url": "string",
    "caption": "caption",
  }
};

Infographics.config = {
  "zoomable": true
};

// This is used for the auto-generated docs
// -----------------
//

Infographics.description = {
  "name": "Infographics",
  "remarks": [
    "An infographics PDF.",
  ],
  "properties": {
    "label": "Label used as header for the infographics cards",
    "url": "Image url",
    "caption": "A reference to a caption node that describes the infographics",
    "attrib": "Infographics attribution"
  }
};

// Example File
// -----------------
//

Infographics.example = {
  "id": "infographics_1",
  "label": "Infographics 1",
  "url": "http://example.com/fig1.png",
  "caption": "caption_1"
};

Infographics.Prototype = function() {
  this.getCaption = function() {
    if (this.properties.caption) return this.document.get(this.properties.caption);
  };

  this.getHeader = function() {
    return this.properties.label;
  };
};

Infographics.Prototype.prototype = Document.Node.prototype;
Infographics.prototype = new Infographics.Prototype();
Infographics.prototype.constructor = Infographics;

Document.Node.defineProperties(Infographics);

module.exports = Infographics;
