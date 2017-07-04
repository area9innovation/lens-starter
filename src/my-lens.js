"use strict";

var Lens = require("lens/reader");
  
var JbjsConverter = require("./jbjs_converter");
var FollowCitationRefs = require("./workflows/follow_citation_refs");
var TableScaling = require("./workflows/table_scaling");
var BrightcoveVideos = require("./workflows/brightcove");
var FollowCrossRefs = require("./workflows/follow_crossrefs");
var ScrollbarManager = require("./workflows/scrollbar");
var ExternalMenu = require("./workflows/external_menu");

var LensApp = function(config) {
  this.config = config;
  
  this.config.scrollbar_position = this.config.scrollbar_position ||
    (( this.config.show_resources_panel !== undefined && this.config.show_resources_panel === false)
      ? 'none' 
      : 'left');

  Lens.call(this, config);
};

LensApp.Prototype = function() {

  // Custom converters
  // --------------
  // 
  // Provides a sequence of converter instances
  // Converter.match will be called on each instance with the
  // XML document to processed. The one that returns true first
  // will be chosen. You can change the order prioritize
  // converters over others

  this.getConverters = function(converterOptions) {
    return [
      new JbjsConverter(converterOptions, this.config),
    ]
  };

  this.getWorkflows = function() {
    if ( this.config.show_resources_panel ) {
      var ws = this.constructor.Prototype.prototype.getWorkflows.call(this).slice(0);
      ws.unshift(new BrightcoveVideos(this.config.bcvideo_account_id, this.config.bcvideo_player_id));
      
      if ( this.config.full_screen_toggler ) {
        ws.unshift(new ExternalMenu(this.config.full_screen_toggler));
      }
      return ws;
    } else {
      return [
        new ScrollbarManager(this.config.scrollbar_position),
        new FollowCrossRefs(),
        new FollowCitationRefs(),
        new TableScaling(),
        new BrightcoveVideos(this.config.bcvideo_account_id, this.config.bcvideo_player_id),
      ];
    }
  };

  this.start = function() {
    if (this.config.el === undefined) {
      this.constructor.Prototype.prototype.start.call(this);
    } else {
      this.render();
      this.initRouter();
    }
  };
};

LensApp.Prototype.prototype = Lens.prototype;
LensApp.prototype = new LensApp.Prototype();
LensApp.prototype.constructor = LensApp;

module.exports = LensApp;