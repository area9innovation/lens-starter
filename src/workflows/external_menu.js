"use strict";

var _ = require("underscore");
var Workflow = require('lens/reader/workflows/workflow');

var ExternalMenu = function(fullScreenToggler, externalMenuCB) {
  Workflow.apply(this);
  this.fullScreenToggler = fullScreenToggler;
  this.externalMenuCB = externalMenuCB;
};

ExternalMenu.Prototype = function() {
  this.handlesStateUpdate = true;
  this.pass = 0;

  this.registerHandlers = function() {
  };

  this.unRegisterHandlers = function() {
  };

  this.handleStateUpdate = function(state, stateInfo) {
    ++this.pass;
    if ( this.pass > 1 ) return;

    $('.resources .menu-bar').append('<div class="context-toggles external-menu"><a href="#" class="fullscreen">' + this.fullScreenToggler() + '</a></div>');
    
    var this_ = this;
    $('.resources .menu-bar a.fullscreen').on('click', function() {
      $('.resources .menu-bar a.fullscreen').text(this_.toggleFullScreen());
    });

    if( this.externalMenuCB ) this.externalMenuCB();
    
    return false;
  };

  this.toggleFullScreen = function() {
    var scrollTop = this.readerView.contentView.surface.$el.scrollTop();

    var panelScrollTop = undefined;

    var currentPanel = this.readerView.panelViews[this.readerCtrl.state.panel];
    if (currentPanel && currentPanel.hasScrollbar()) {
      panelScrollTop = currentPanel.surface.$el.scrollTop();
    }

    var text = this.fullScreenToggler();

    this.readerView.contentView.surface.$el.scrollTop(scrollTop);
    
    if ( panelScrollTop ) {
      currentPanel.surface.$el.scrollTop(panelScrollTop); 
    }

    return text;
  };
};

ExternalMenu.Prototype.prototype = Workflow.prototype;
ExternalMenu.prototype = new ExternalMenu.Prototype();

module.exports = ExternalMenu;

