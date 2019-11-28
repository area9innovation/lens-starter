"use strict";

var ContainerPanel = require('lens/reader').ContainerPanel;

var panel = new ContainerPanel({
  type: 'resource',
  header: false,
  name: 'supplemental',
  container: 'supplemental',
  title: 'Supplemental',
  icon: 'fa-photo-video',
  references: ['infographic_reference', 'videosummary_reference', 'supplement']
});

module.exports = panel;
