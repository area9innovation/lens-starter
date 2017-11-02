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
            console.log('none');
          }
        }, 100);

        var ds = [];

        var handcarWorker = function() {
          var imageFillin = this;
//          if( imageFillin.complete ) return;

          $(imageFillin).hide();

          var deferred = $.Deferred();

          ds.push(deferred);
/*
          deferred.always(function(){
            $(imageFillin).show();
            if($('.spinner-wrapper').css('display') == 'none') {
              console.log('defer1');
              _.defer(function()
                {
                  that.readerView.contentView.findNodeView(stateInfo.focussedNode.id).scrollIntoView();
                  console.log('defer');
                });
            }
          });
*/
          $(imageFillin).one('load', deferred.resolve);
        };

        $('.surface.resource-view.content .image-wrapper img').each(handcarWorker);

        $.when.apply($, ds).then(function(){
          console.log('when1');
          $('.surface.resource-view.content .image-wrapper img').show();
          if($('.spinner-wrapper').css('display') == 'none') {
            that.readerView.contentView.findNodeView(stateInfo.focussedNode.id).scrollIntoView();
            console.log('when');
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
