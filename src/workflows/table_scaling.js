"use strict";

var Workflow = require('lens/reader/workflows/workflow');

var TableScaling = function() {
  Workflow.apply(this, arguments);
};

TableScaling.Prototype = function() {
  this.handlesStateUpdate = true;
  this.pass = 0;

  this.registerHandlers = function() {
  };

  this.unRegisterHandlers = function() {
    $(window).off("resize", this.DoScaling);
  };

  this.handleStateUpdate = function(state, stateInfo) {
    ++this.pass;
    if ( this.pass > 1 ) return;

    this.DoScaling();

    $(window).on("resize", this.DoScaling);
  };

  this.DoScaling = function() {
    $('.table-wrapper').each(function(){
      var pw = $(this).width();
      var tw = $(this).children('table').width();
      if ( tw > pw ) {
        var wScale = pw / (tw + 4);
        var hScale = pw / tw;

        $(this).css('overflow', 'hidden');
        
        $(this).children('table')
          .css('transform-origin', 'left top')
          .css('transform', 'scale(' + wScale + ')');

        $(this).height($(this).children('table').height() * hScale + 5);

      } else {
        
        $(this).css('overflow', 'auto');

        $(this).children('table').css('transform', 'scale(1)');

        $(this).height('100%');
      }
    });
  };
};

TableScaling.Prototype.prototype = Workflow.prototype;
TableScaling.prototype = new TableScaling.Prototype();

module.exports = TableScaling;

