"use strict";

var Document = require('lens/substance/document');
var Annotation = require('lens/article/nodes/annotation/annotation');
var ResourceReference = require('lens/article/nodes/resource_reference/resource_reference');

var FootnoteReference = function(node, doc) {
  ResourceReference.call(this, node, doc);
};

FootnoteReference.type = {
  id: "footnote_reference",
  parent: "resource_reference",
  properties: {
    "target": "footnote"
  }
};

FootnoteReference.Prototype = function() {};
FootnoteReference.Prototype.prototype = ResourceReference.prototype;
FootnoteReference.prototype = new FootnoteReference.Prototype();
FootnoteReference.prototype.constructor = FootnoteReference;

// Do not fragment this annotation
FootnoteReference.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(FootnoteReference);

module.exports = FootnoteReference;
