
var Document = require('lens/substance/document');
var Annotation = require('lens/article/nodes/annotation/annotation');
var ResourceReference = require('lens/article/nodes/resource_reference/resource_reference');

var ELetterReference = function(node, doc) {
  ResourceReference.call(this, node, doc);
};

ELetterReference.type = {
  id: "eletter_reference",
  parent: "resource_reference",
  properties: {
    "target": "eletters"
  }
};

ELetterReference.Prototype = function() {};
ELetterReference.Prototype.prototype = ResourceReference.prototype;
ELetterReference.prototype = new ELetterReference.Prototype();
ELetterReference.prototype.constructor = ELetterReference;

// Do not fragment this annotation
ELetterReference.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(ELetterReference);

module.exports = ELetterReference;
