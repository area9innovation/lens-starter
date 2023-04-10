"use strict";

var Document = require('../../../substance/document');

var VerseLine = function(node, document) {
  Document.Composite.call(this, node, document);
};


VerseLine.type = {
  "parent": "content",
  "properties": {
    "text": "string",
  }
};

// This is used for the auto-generated docs
// -----------------
//

VerseLine.description = {
  "name": "VerseLine",
  "remarks": [
    "A verse line",
  ],
  "properties": {
    "text": "Text that is shown on the screen",
  }
};

// Example File
// -----------------
//

VerseLine.example = {
  "id": "verseLine_1",
  "text": "This is verse line"
};

VerseLine.Prototype = function() {
  this.getChildrenIds = function () {
    return []
  }

  this.getText = function () {
    return this.properties.text;
  }
};

VerseLine.Prototype.prototype = Document.Composite.prototype;
VerseLine.prototype = new VerseLine.Prototype();
VerseLine.prototype.constructor = VerseLine;

Document.Node.defineProperties(VerseLine.prototype, Object.keys(VerseLine.type.properties));

module.exports = VerseLine;
