
var Document = require('lens/substance/document');
var Annotation = require('lens/article/nodes/annotation/annotation');
var ResourceReference = require('lens/article/nodes/resource_reference/resource_reference');

var AuthorInsightsReference = function(node, doc) {
  ResourceReference.call(this, node, doc);
};

AuthorInsightsReference.type = {
  id: "authorinsights_reference",
  parent: "resource_reference",
  properties: {
    "target": "authorinsights"
  }
};

AuthorInsightsReference.Prototype = function() {};
AuthorInsightsReference.Prototype.prototype = ResourceReference.prototype;
AuthorInsightsReference.prototype = new AuthorInsightsReference.Prototype();
AuthorInsightsReference.prototype.constructor = AuthorInsightsReference;

// Do not fragment this annotation
AuthorInsightsReference.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(AuthorInsightsReference);

module.exports = AuthorInsightsReference;
