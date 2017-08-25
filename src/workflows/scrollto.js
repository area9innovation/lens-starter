"use strict";

var _ = require('underscore');
var Workflow = require('lens/reader/workflows/workflow');

var ScrollToReference = function() {
  Workflow.apply(this, arguments);
};

ScrollToReference.Prototype = function() {

  this.registerHandlers = function() {
  };

  this.unRegisterHandlers = function() {
  };

  this.handlesStateUpdate = true;

  this.handleStateUpdate = function(state, stateInfo) {
    console.log(stateInfo.focussedNode);
    if ( stateInfo.focussedNode ) {
      this.readerView.contentView.findNodeView(stateInfo.focussedNode.id).scrollIntoView();
    }
    return false;
  };

};
ScrollToReference.Prototype.prototype = Workflow.prototype;
ScrollToReference.prototype = new ScrollToReference.Prototype();

module.exports = ScrollToReference;
