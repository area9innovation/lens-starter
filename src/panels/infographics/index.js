"use strict";

var ContainerPanel = require('lens/reader').ContainerPanel;

var panel = new ContainerPanel({
  type: 'resource',
  header: false,
  name: 'infographics',
  container: 'infographics',
  title: 'Infographics',
  icon: 'fa-picture-o',
});

module.exports = panel;
