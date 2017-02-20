"use strict";

var _ = require("underscore");
var Workflow = require('lens/reader/workflows/workflow');

var BrightcoveVideos = function(accountId, playerId) {
  Workflow.apply(this);
  this.accountId = accountId;
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

    var playerId = this.playerId;
    var accountId = this.accountId;

    $('.video-wrapper video').each(function(){
      $(this).attr({
            'data-account': accountId,
            'data-player': playerId.split('_')[0],
            'data-embed': playerId.split('_')[1],
          });
    });

    $('body').append('<script src="//players.brightcove.net/' + accountId + '/' + playerId + '/index.min.js"></script>');

    return false;
  };
};

BrightcoveVideos.Prototype.prototype = Workflow.prototype;
BrightcoveVideos.prototype = new BrightcoveVideos.Prototype();

module.exports = BrightcoveVideos;

