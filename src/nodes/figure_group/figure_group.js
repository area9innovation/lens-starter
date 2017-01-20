'use strict';

var _ = require('underscore');

var Document = require('lens/substance/document');

var FigureGroup = function(node, document) {
  Document.Composite.call(this, node, document);
};


FigureGroup.type = {
  parent: 'content',
  properties: {
    source_id: 'string',
    caption: 'caption',
    position: 'string',
    orientation: 'string',
    children: ['array', 'content'],
  }
};

FigureGroup.description = {
  name: 'Figures group',
  remarks: [
    'A group of figures',
  ],
  properties: {
    caption: 'A reference to a caption node that describes the figures group',
    position: 'Position',
    orientation: 'Orientation',
    children: "An array of content node references",
  }
};


FigureGroup.example = {
  id: 'figure_group_1',
  caption: 'caption_1',
  position: 'float',
  orientation: 'portrait',
  children: ['caption', 'figure1', 'figure2'],
};

FigureGroup.Prototype = function() {

  this.hasCaption = function() {
    return (!!this.properties.caption);
  };

  this.getCaption = function() {
    if (this.properties.caption) return this.document.get(this.properties.caption);
  };

  this.getLength = function() {
    return this.properties.children.length;
  };

  this.getChildrenIds = function() {
    return _.clone(this.properties.children);
  };

  this.getChildren = function() {
    return _.map(this.properties.children, function(id) {
      return this.document.get(id);
    }, this);
  };

};

FigureGroup.Prototype.prototype = Document.Composite.prototype;
FigureGroup.prototype = new FigureGroup.Prototype();
FigureGroup.prototype.constructor = FigureGroup;

Document.Node.defineProperties(FigureGroup.prototype, Object.keys(FigureGroup.type.properties));

module.exports = FigureGroup;
