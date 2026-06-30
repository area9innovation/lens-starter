"use strict";
var Document = require('../../../substance/document');

var WebResource = function(node, doc) {
  Document.Node.call(this, node, doc);
};

WebResource.type = {
  "id": "webresource",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "url": "string"
  }
};

WebResource.description = {
  "name": "WebResource",
  "description": "A resource which can be accessed via URL",
  "remarks": [
    "This element is a parent for several other nodes such as Image."
  ],
  "properties": {
    "url": "URL to a resource",
  }
};


WebResource.example = {
  "type": "webresource",
  "id": "webresource_3",
  "url": "http://elife.elifesciences.org/content/elife/1/e00311/F3.medium.gif"
};

WebResource.Prototype = function() {};

WebResource.Prototype.prototype = Document.Node.prototype;
WebResource.prototype = new WebResource.Prototype();
WebResource.prototype.constructor = WebResource;

Document.Node.defineProperties(WebResource.prototype, ["url"]);

module.exports = WebResource;
