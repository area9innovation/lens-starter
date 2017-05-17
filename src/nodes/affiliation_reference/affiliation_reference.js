"use strict";

var Document = require('lens/substance/document');
var Annotation = require('lens/article/nodes/annotation/annotation');
var ResourceReference = require('lens/article/nodes/resource_reference/resource_reference');

var AffiliationReference = function(node, doc) {
  ResourceReference.call(this, node, doc);
};

AffiliationReference.type = {
  id: "affiliation_reference",
  parent: "resource_reference",
  properties: {
    "target": "affiliation"
  }
};

AffiliationReference.Prototype = function() {};
AffiliationReference.Prototype.prototype = ResourceReference.prototype;
AffiliationReference.prototype = new AffiliationReference.Prototype();
AffiliationReference.prototype.constructor = AffiliationReference;

// Do not fragment this annotation
AffiliationReference.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(AffiliationReference);

module.exports = AffiliationReference;
