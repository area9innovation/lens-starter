"use strict";

var Lens = require("lens/reader");
  
var JbjsConverter = require("./jbjs_converter");

var LensApp = function(config) {
  this.config = config;
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