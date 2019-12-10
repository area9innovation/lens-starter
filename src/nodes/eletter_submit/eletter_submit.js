var _ = require('underscore');

var Document = require('lens/substance/document');

// Lens.ELetter
// -----------------
//

var ELetterSubmit = function(node, doc) {
  Document.Node.call(this, node, doc);
};

// Type definition
// -----------------
//

ELetterSubmit.type = {
  "id": "eletter_submit",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "url": "string",
    "caption": "caption", // contains the doi
    "image": "string",
  }
};


// This is used for the auto-generated docs
// -----------------
//

ELetterSubmit.description = {
  "name": "ELetterSubmit",
  "remarks": [
    "A ELetterSubmit entity.",
  ],
  "properties": {
    "source_id": "ELetterSubmit id as it occurs in the source NLM file",
    "label": "ELetterSubmit label",
    "caption": "References a caption node, that has all the content",
    "url": "URL of downloadable file",
    "image": "URL of additional image",
  }
};

// Example ELetterSubmit
// -----------------
//

ELetterSubmit.example = {
  "id": "eletter_submit_1",
  "source_id": "EL1-data",
  "type": "eletter_submit",
  "label": "ELetterSubmit file 1.",
  "url": "http://myserver.com/myfile.pdf",
  "caption": "caption_eLetter_submit_1"
};


ELetterSubmit.Prototype = function() {

  this.getChildrenIds = function() {
    var nodes = [];
    if (this.properties.caption) {
      nodes.push(this.properties.caption);
    }
    return nodes;
  };

  this.getCaption = function() {
    if (this.properties.caption) {
      return this.document.get(this.properties.caption);
    } else {
      return null;
    }
  };

  this.getHeader = function() {
    return this.properties.label;
  };
};

ELetterSubmit.Prototype.prototype = Document.Node.prototype;
ELetterSubmit.prototype = new ELetterSubmit.Prototype();
ELetterSubmit.prototype.constructor = ELetterSubmit;

Document.Node.defineProperties(ELetterSubmit);

module.exports = ELetterSubmit;
