"use strict";

var _ = require("underscore");
var Workflow = require('lens/reader/workflows/workflow');

var BrightcoveVideos = function(resolver, playerId) {
  Workflow.apply(this);
  this.resolver = resolver;
  this.playerId = playerId;
};

BrightcoveVideos.Prototype = function() {
  this.handlesStateUpdate = true;
  this.pass = 0;

  this.registerHandlers = function() {
  };

  this.unRegisterHandlers = function() {
  };

  this.handleStateUpdate = function(state, stateInfo) {
    ++this.pass;
    if ( this.pass > 1 ) return;

    var refs = [];

    $('.video-wrapper iframe').each(function(){
      refs.push($(this).attr('data-id'));
    });

    var playerId = this.playerId;

    $.getJSON(this.resolver, {refs:refs}, function( data ) {
      _.each(data, function( video) {
        $('.video-wrapper iframe[data-id=' + video.reference_id + ']')
          .attr('src', [
            '//players.brightcove.net/', 
            video.account_id,
            '/',
            playerId,
            '/index.html?videoId=',
            video.id
          ].join(''));
      });
    });

    return false;
  };
};

BrightcoveVideos.Prototype.prototype = Workflow.prototype;
BrightcoveVideos.prototype = new BrightcoveVideos.Prototype();

module.exports = BrightcoveVideos;

