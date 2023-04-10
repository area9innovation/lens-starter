var AnnotationView = require('../annotation').View;

var BreakView = function(node) {
  AnnotationView.call(this, node);
};

BreakView.Prototype = function() {

  this.setClasses = function() {
  };

  this.createElement = function() {
  	return document.createElement('BR');
  };

  this.render = function() {
    return this;
  };

};
BreakView.Prototype.prototype = AnnotationView.prototype;
BreakView.prototype = new BreakView.Prototype();

module.exports = BreakView;
