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
    if ( stateInfo.focussedNode ) {
      if( navigator.vendor.indexOf('Apple') == -1) {
        this.readerView.contentView.findNodeView(stateInfo.focussedNode.id).scrollIntoView();
      } else {
        var that = this;
        var timerId = setInterval(function() {
          if($('.spinner-wrapper').css('display') == 'none') {
            clearInterval(timerId);
            that.readerView.contentView.findNodeView(stateInfo.focussedNode.id).scrollIntoView();
          }
        }, 100);

        var ds = [];

        var handcarWorker = function() {
          var imageFillin = this;

          $(imageFillin).hide();

          var deferred = $.Deferred();
          ds.push(deferred);

          $(imageFillin).one('load', deferred.resolve);
        };

        $('.surface.resource-view.content .image-wrapper img').each(handcarWorker);

        $.when.apply($, ds).then(function(){
          $('.surface.resource-view.content .image-wrapper img').show();
          if($('.spinner-wrapper').css('display') == 'none') {
            that.readerView.contentView.findNodeView(stateInfo.focussedNode.id).scrollIntoView();
          }
        });
      }
    }
    return false;
  };

};
ScrollToReference.Prototype.prototype = Workflow.prototype;
ScrollToReference.prototype = new ScrollToReference.Prototype();

module.exports = ScrollToReference;
