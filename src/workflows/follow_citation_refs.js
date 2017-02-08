"use strict";

var _ = require('underscore');
var Workflow = require('lens/reader/workflows/workflow');

var FollowCitationRefs = function() {
  Workflow.apply(this, arguments);

  this._followCitationReference = _.bind(this.followCitationReference, this);
  this._citationClick = _.bind(this.citationClick, this);
};

FollowCitationRefs.Prototype = function() {
  this.lastFromId = undefined;

  this.registerHandlers = function() {
    this.readerView.contentView.off('toggle-resource-reference'); // turn off hardcoded handler in Lens reader_view.js
    this.readerView.listenTo(this.readerView.contentView, "toggle-resource-reference", this._followCitationReference);
    this.readerView.$el.on('click', '.back', this._citationClick);
  };

  this.unRegisterHandlers = function() {
    this.readerView.contentView.off('toggle-resource-reference', this._followCitationReference);
    this.readerView.$el.off('click', '.back', this._citationClick);
  };

  this.followCitationReference = function(panel, id, element) {
    var ref = this.readerCtrl.getDocument().get(id);
    this.lastFromId = id;
    this.readerView.contentView.scrollTo(ref.target);
    var citationNode = this.readerView.contentView.findNodeView(ref.target);
    $(citationNode).addClass('back');
  };

  this.citationClick = function(e) {
    if ( this.lastFromId !== undefined) {
      $('.citation').removeClass('back');
      this.readerView.contentView.scrollTo(this.lastFromId);
      this.lastFromId = undefined;
    }
  };
};

FollowCitationRefs.Prototype.prototype = Workflow.prototype;
FollowCitationRefs.prototype = new FollowCitationRefs.Prototype();

module.exports = FollowCitationRefs;

