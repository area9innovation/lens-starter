"use strict";

var Document = require('lens/substance/document');

var Infographic = function(node, document) {
  Document.Composite.call(this, node, document);
};

Infographic.type = {
  "parent": "content",
  "properties": {
    "id": "string",
    "type": "string",
    "label": "string",
    "url": "string",
    "caption": "caption",
    "isMobile": "boolean"
  }
};

Infographic.config = {
  "zoomable": true
};

// This is used for the auto-generated docs
// -----------------
//

Infographic.description = {
  "name": "Infographic",
  "remarks": [
    "An infographic PDF.",
  ],
  "properties": {
    "label": "Label used as header for the infographic cards",
    "url": "Image url",
    "caption": "A reference to a caption node that describes the infographic",
    "attrib": "Infographic attribution"
  }
};

// Example File
// -----------------
//

Infographic.example = {
  "id": "infographic_1",
  "type": "infographic",
  "label": "Infographic 1",
  "url": "http://example.com/fig1.png",
  "caption": "caption_1",
  "isMobile": false
};

Infographic.Prototype = function() {
  this.getCaption = function() {
    if (this.properties.caption) return this.document.get(this.properties.caption);
  };

  this.getHeader = function() {
    return this.properties.label;
  };
};

Infographic.Prototype.prototype = Document.Node.prototype;
Infographic.prototype = new Infographic.Prototype();
Infographic.prototype.constructor = Infographic;

Document.Node.defineProperties(Infographic);

module.exports = Infographic;
