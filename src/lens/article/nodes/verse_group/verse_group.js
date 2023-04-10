'use strict';

var _ = require('underscore');

var Document = require('../../../substance/document');

var VerseGroup = function(node, document) {
  Document.Composite.call(this, node, document);
};


VerseGroup.type = {
  parent: 'content',
  properties: {
    children: ['array', 'content'],
  }
};

VerseGroup.description = {
  name: 'Verse group',
  remarks: [
    'Verse group',
  ],
  properties: {
    children: "An array of content node references",
  }
};


VerseGroup.example = {
  id: 'verse_group_1',
  children: ['caption', 'verse1', 'verse2'],
};

VerseGroup.Prototype = function() {
  this.getChildrenIds = function() {
    return _.clone(this.properties.children);
  };

  this.getChildren = function() {
    return _.map(this.properties.children, function(id) {
      return this.document.get(id);
    }, this);
  };
};

VerseGroup.Prototype.prototype = Document.Composite.prototype;
VerseGroup.prototype = new VerseGroup.Prototype();
VerseGroup.prototype.constructor = VerseGroup;

Document.Node.defineProperties(VerseGroup.prototype, Object.keys(VerseGroup.type.properties));

module.exports = VerseGroup;
