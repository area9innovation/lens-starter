var _ = require('underscore');
var Document = require('../../../substance/document');

// Lens.Cover
// -----------------
//

var Abstract = function(node, doc) {
  Document.Node.call(this, node, doc);
};

// Type definition
// -----------------
//

Abstract.type = {
  "id": "abstract",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "sections": ["array", "paragraph"]
  }
};


// This is used for the auto-generated docs
// -----------------
//

Abstract.description = {
  "name": "Abstract",
  "remarks": [
    "Virtual view on the abstract"
  ],
  "properties": {
    "sections": "A paragraph that has section titles and contents"
  }
};

// Example Abstract
// -----------------
//

Abstract.example = {
  "id": "abstract",
  "type": "abstract"
};

Abstract.Prototype = function() {

  this.getSections = function() {
    return _.map(this.properties.sections, function(paragraphId) {
      return this.document.get(paragraphId);
    }, this);
  };

};

Abstract.Prototype.prototype = Document.Node.prototype;
Abstract.prototype = new Abstract.Prototype();
Abstract.prototype.constructor = Abstract;

Document.Node.defineProperties(Abstract);

module.exports = Abstract;
