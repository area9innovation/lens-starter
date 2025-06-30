var AnnotationView = require('../annotation').View;

var InlineImageView = function(node) {
  AnnotationView.call(this, node);
};

InlineImageView.Prototype = function() {

  this.createElement = function() {
    var el = document.createElement('img');
    el.setAttribute('src', this.node.properties.url);
    return el;
  };
  this.setClasses = function() {
    this.$el.addClass(this.node.type);
  };

};
InlineImageView.Prototype.prototype = AnnotationView.prototype;
InlineImageView.prototype = new InlineImageView.Prototype();

module.exports = InlineImageView;
