"use strict";

var _ = require('underscore');
var $$ = require ("lens/substance/application").$$;
var ResourceView = require('lens/article/resource_view');
var NodeView = require("lens/article/nodes/node").View;
var pdfjsLib = require('pdfjs-dist');

pdfjsLib.GlobalWorkerOptions.workerSrc = 'elensreader/lens.worker.js';

// Substance.Infographic.View
// ==========================================================================

var InfographicView = function (node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);
};

InfographicView.Prototype = function() {
  var minScale = 0.1,
    maxScale = 10,
    scaleDelta = 1.2,
    dragScroll = true;

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.isZoomable = true;

  // Rendering
  // =============================
  //

  this.renderBody = function () {
    var node = this.node;
    var that = this;

    if (node.label) {
      this.content.appendChild($$('.label', { text: node.label }));
    }

    if (!node.url) return;

    var el = $$('.infographic-wrapper', {
      children: [
        $$('div', {
          class: 'viewer' + (that.isFullscreen() ? ' fullscreen' : ''),
          children: [
            $$('div', { class: 'progress-bar' }),
            $$('div', { class: 'pages' }),
            $$('div', { 
              class: 'tool-bar', 
              children: [
                //$$('button', { id: 'prev-page', text: '<' }),
                //$$('button', { id: 'next-page', text: '>' }),
                $$('button', { id: 'zoom-out', text: '-' }),
                $$('button', { id: 'zoom-in', text: '+' }),
                $$('button', { id: 'fullscreen', text: 'Fullscreen ' + (that.isFullscreen() ? 'OFF' : 'ON') })
              ]
            })
          ]
        })
      ]
    });

    this.content.appendChild(el);

    this.viewerContainer = el.firstChild;
    this.progressBar = this.viewerContainer.firstChild;
    this.pagesContainer = this.progressBar.nextElementSibling;
    this.currentScale = 0;
    this.pages = [];

    var loadingTask = pdfjsLib.getDocument({ url: node.url })

    loadingTask.onProgress = function (progressData) {
      that.progressBar.style.width = (progressData.loaded / progressData.total) * 100 + '%';
    };

    loadingTask.promise.then(function (pdf) {
      document.addEventListener('fullscreenchange', function () { that.onFullScreenChange(); }); // webkitfullscreenchange mozfullscreenchange
      document.addEventListener('MSFullscreenChange', function () { that.onFullScreenChange(); });

      document.getElementById('zoom-in').addEventListener('click', function () { that.zoomIn(); });
      document.getElementById('zoom-out').addEventListener('click', function () { that.zoomOut(); });

      document.getElementById('fullscreen').addEventListener('click', function () { 
        if (that.isFullscreen()) that.requestFullScreenOff(); 
        else that.requestFullScreenOn(); 
      });

      that.renderPdf(pdf);

      that.progressBar.style.display = 'none';

      that.setDragScrollHandler();
    });
  };

  this.onFullScreenChange = function (e) {
    var el = document.getElementById('fullscreen');

    if (this.isFullscreen()) {
      this.viewerContainer.classList.add('fullscreen');
      el.textContent = 'Fullscreen OFF';
    } else {
      this.viewerContainer.classList.remove('fullscreen');
      el.textContent = 'Fullscreen ON';
    }
  }

  this.renderPdf = function (pdf) {
    var that = this;

    pdf.getPage(1).then(function (page) {
      that.initPage(page);
    });
  }

  this.initPage = function (page) {
    var canvas = document.createElement('canvas'),
      viewport;

    canvas.classList.add('page');
    this.pagesContainer.appendChild(canvas);

    if (!this.pages.length) {
      viewport = page.getViewport({ scale: 1 });
      this.currentScale = (this.pagesContainer.clientWidth - 32) / viewport.width;
    }

    this.pages.push({
      page: page,
      canvas: canvas
    });

    this.renderPage(0);
  }

  this.renderPage = function (pageIndex) {
    var currentPage = this.pages[pageIndex],
      page = currentPage.page,
      canvas = currentPage.canvas,
      viewport = page.getViewport({ scale: this.currentScale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page.render({
      canvasContext: canvas.getContext('2d'),
      viewport: viewport
    });
  }

  this.zoomIn = function () {
    if (this.currentScale < maxScale) this.currentScale *= scaleDelta;
    if (this.currentScale > maxScale) this.currentScale = maxScale;

    this.renderPage(0);
  }

  this.zoomOut = function () {
    if (this.currentScale > minScale) this.currentScale /= scaleDelta;
    if (this.currentScale < minScale) this.currentScale = minScale;

    this.renderPage(0);
  }

  this.requestFullScreenOn = function () {
    if (this.viewerContainer.requestFullscreen) {
      this.viewerContainer.requestFullscreen();
    } else if (this.viewerContainer.webkitRequestFullscreen) {
      this.viewerContainer.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (this.viewerContainer.mozRequestFullScreen) {
      this.viewerContainer.mozRequestFullScreen();
    } else if (this.viewerContainer.msRequestFullscreen) {
      this.viewerContainer.msRequestFullscreen();
    } else {
      return false;
    }

    return true;
  }

  this.requestFullScreenOff = function () {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else {
      return false;
    }

    return true;
  }

  this.isFullscreen = function () {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  }

  this.setDragScrollHandler = function () {
    var that = this,
      pages = that.pagesContainer,
      pushed, 
      lastClientX, 
      lastClientY;

    pages.addEventListener('mousedown', function (e) {
      pushed = 1;
      lastClientX = e.clientX;
      lastClientY = e.clientY;

      e.preventDefault();
      e.stopPropagation();
    }, 0);

    pages.addEventListener('mouseup', function (e) { pushed = 0; }, 0);

    pages.addEventListener('mousemove', function (e) { 
      if (!pushed) return;

      var newScrollX, 
        newScrollY;

      pages.scrollLeft -= newScrollX = (-lastClientX + (lastClientX = e.clientX));
      pages.scrollTop -= newScrollY = (-lastClientY + (lastClientY = e.clientY));
    }, 0);
  }
};

InfographicView.Prototype.prototype = NodeView.prototype;
InfographicView.prototype = new InfographicView.Prototype();

module.exports = InfographicView;
