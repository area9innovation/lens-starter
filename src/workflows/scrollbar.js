"use strict";

var _ = require("underscore");
var Workflow = require('lens/reader/workflows/workflow');

var ScrollbarManager = function(position) {
  Workflow.apply(this);
  this.position = position;
};

ScrollbarManager.Prototype = function() {
  this.handlesStateUpdate = true;
  this.pass = 0;

  this.registerHandlers = function() {
  };

  this.unRegisterHandlers = function() {
  };

  this.handleStateUpdate = function(state, stateInfo) {
    ++this.pass;
    if ( this.pass > 1 ) return;

    switch ( this.position ) {
      case 'right': {
        $('.surface-scrollbar').css({
          left: 'unset',
          right: '0px',
        });

        $('.scrollbar-cover').css({
          display: 'none',
        });

        $('.surface.content .nodes').css({
          'padding-left': '0px',
        });

        break;
      }

      case 'none': {
        $('.surface-scrollbar').css({
          display: 'none',
        });

        $('.surface.content .nodes').css({
          'padding-left': '0px',
        });

        break;
      }
    }

    return false;
  };
};

ScrollbarManager.Prototype.prototype = Workflow.prototype;
ScrollbarManager.prototype = new ScrollbarManager.Prototype();

module.exports = ScrollbarManager;

