"use strict";

var ContainerPanel = require('lens/reader').ContainerPanel;

var panel = new ContainerPanel({
  type: 'resource',
  header: false,
  name: 'videosummary',
  container: 'videosummary',
  title: 'Video Summary',
  icon: 'fa-picture-o',
});

module.exports = panel;
