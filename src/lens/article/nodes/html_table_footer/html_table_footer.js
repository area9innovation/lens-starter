
var Document = require('../../../substance/document');

var HTMLTableFooter = function(node, doc) {
  Document.Node.call(this, node, doc);
};

HTMLTableFooter.type = {
  id: "html_table_footer",
  parent: "content",
  properties: {
    "label": "string",
    "content": "string"
  }
};

HTMLTableFooter.Prototype = function() {};
HTMLTableFooter.Prototype.prototype = Document.Node.prototype;
HTMLTableFooter.prototype = new HTMLTableFooter.Prototype();
HTMLTableFooter.prototype.constructor = HTMLTableFooter;

Document.Node.defineProperties(HTMLTableFooter);

module.exports = HTMLTableFooter;
