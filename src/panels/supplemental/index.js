"use strict";

var ContainerPanel = require('lens/reader').ContainerPanel;

var panel = new ContainerPanel({
  type: 'resource',
  header: false,
  name: 'supplemental',
  container: 'supplemental',
  title: 'Supplemental',
  icon: 'fa-picture-o',
});

module.exports = panel;
