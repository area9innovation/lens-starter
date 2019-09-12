
var Document = require('lens/substance/document');
var Annotation = require('lens/article/nodes/annotation/annotation');
var ResourceReference = require('lens/article/nodes/resource_reference/resource_reference');

var VideosummaryReference = function(node, doc) {
  ResourceReference.call(this, node, doc);
};

VideosummaryReference.type = {
  id: "videosummary_reference",
  parent: "resource_reference",
  properties: {
    "target": "videosummary"
  }
};

VideosummaryReference.Prototype = function() {};
VideosummaryReference.Prototype.prototype = ResourceReference.prototype;
VideosummaryReference.prototype = new VideosummaryReference.Prototype();
VideosummaryReference.prototype.constructor = VideosummaryReference;

// Do not fragment this annotation
VideosummaryReference.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(VideosummaryReference);

module.exports = VideosummaryReference;
