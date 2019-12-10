var _ = require('underscore');

var Document = require('lens/substance/document');

// Lens.ELetter
// -----------------
//

var ELetter = function(node, doc) {
  Document.Node.call(this, node, doc);
};

// Type definition
// -----------------
//

ELetter.type = {
  "id": "eletter",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "url": "string",
    "caption": "caption", // contains the doi
    "icon": "string",
  }
};


// This is used for the auto-generated docs
// -----------------
//

ELetter.description = {
  "name": "ELetter",
  "remarks": [
    "A ELetter entity.",
  ],
  "properties": {
    "source_id": "ELetter id as it occurs in the source NLM file",
    "label": "ELetter label",
    "caption": "References a caption node, that has all the content",
    "url": "URL of downloadable file",
    "icon": "URL of additional icon",
  }
};

// Example ELetter
// -----------------
//

ELetter.example = {
  "id": "eletter_1",
  "source_id": "EL1-data",
  "type": "eletter",
  "label": "ELetter file 1.",
  "url": "http://myserver.com/myfile.pdf",
  "caption": "caption_eletter_1"
};


ELetter.Prototype = function() {

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

ELetter.Prototype.prototype = Document.Node.prototype;
ELetter.prototype = new ELetter.Prototype();
ELetter.prototype.constructor = ELetter;

Document.Node.defineProperties(ELetter);

module.exports = ELetter;
