"use strict";

var ContainerPanel = require('lens/reader').ContainerPanel;

var panel = new ContainerPanel({
  type: 'resource',
  name: 'infographics',
  container: 'infographics',
  title: 'Infographics',
  icon: 'fa-picture-o',
});

module.exports = panel;
