"use strict";

var Document = require('../../../substance/document');
var Paragraph = require('../paragraph').Model;

var Footnote = function(node, document) {
  Document.Composite.call(this, node, document);
};

Footnote.type = {
  "id": "footnote",
  "parent": "paragraph",
  "properties": {
    "footnoteType": "string",
    "specificUse": "string",
    "label": "string",
    "children": ["array", "string"]
  }
};

// Example
// -------
//

Footnote.example = {
  "type": "footnote",
  "id": "footnote_1",
  "label": "a",
  "children ": [
    "text_1",
    "image_1",
    "text_2"
  ]
};

Footnote.Prototype = function() {

};

Footnote.Prototype.prototype = Paragraph.prototype;
Footnote.prototype = new Footnote.Prototype();
Footnote.prototype.constructor = Footnote;

Document.Node.defineProperties(Footnote.prototype, ["children", "label", "footnoteType", "specificUse"]);

module.exports = Footnote;
