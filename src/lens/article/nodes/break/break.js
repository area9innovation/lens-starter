var Annotation = require('../annotation/annotation');

var Break = function(node, doc) {
  Annotation.call(this, node, doc);
};

Break.type = {
  id: "break",
  parent: "annotation",
  properties: {}
};

Break.Prototype = function() {};
Break.Prototype.prototype = Annotation.prototype;
Break.prototype = new Break.Prototype();
Break.prototype.constructor = Break;

Break.fragmentation = Annotation.DONT_CARE;

module.exports = Break;
