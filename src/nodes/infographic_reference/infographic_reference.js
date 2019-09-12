
var Document = require('lens/substance/document');
var Annotation = require('lens/article/nodes/annotation/annotation');
var ResourceReference = require('lens/article/nodes/resource_reference/resource_reference');

var InfographicReference = function(node, doc) {
  ResourceReference.call(this, node, doc);
};

InfographicReference.type = {
  id: "infographic_reference",
  parent: "resource_reference",
  properties: {
    "target": "infographic"
  }
};

InfographicReference.Prototype = function() {};
InfographicReference.Prototype.prototype = ResourceReference.prototype;
InfographicReference.prototype = new InfographicReference.Prototype();
InfographicReference.prototype.constructor = InfographicReference;

// Do not fragment this annotation
InfographicReference.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(InfographicReference);

module.exports = InfographicReference;
