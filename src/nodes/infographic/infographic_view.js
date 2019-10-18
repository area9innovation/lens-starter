"use strict";

var _ = require('underscore');
var $$ = require ("lens/substance/application").$$;
var ResourceView = require('lens/article/resource_view');
var NodeView = require("lens/article/nodes/node").View;
var pdfjsLib = require('pdfjs-dist');
var fullscreen = require('./fullscreen');
var createCustomEvent = require('./utils').createCustomEvent;

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
    scaleDelta = 1.2;

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.isZoomable = true;

  // Rendering
  // =============================
  //

  this.renderBody = function () {
    var node = this.node;

    if (!node.url) return;

    if (node.label) {
      this.content.appendChild($$('.label', { text: node.label }));
    }

    this.content.appendChild($$('a', { class: 'link', href: node.url, text: 'Download' }));

    var isFullscreen = fullscreen.enabled() && fullscreen.isFullscreen(),
      toolbar = [
        //$$('button', { id: 'prev-page', text: '<' }),
        //$$('button', { id: 'next-page', text: '>' }),
        $$('button', { id: 'zoom-out', text: '-' }),
        $$('button', { id: 'zoom-in', text: '+' })
      ];

    if (fullscreen.enabled()) {
      toolbar.push($$('button', { id: 'full-screen', text: 'Full screen ' + (isFullscreen ? 'OFF' : 'ON') }));
    }

    var el = $$('.infographic-wrapper', {
      children: [
        $$('div', {
          class: 'viewer' + (isFullscreen ? ' fullscreen' : ''),
          children: [
            $$('div', { class: 'progress-bar' }),
            $$('div', { class: 'pages' }),
            $$('div', { 
              class: 'toolbar', 
              children: toolbar
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
    this.pages = [], 
    this.lastScrollTop = 0;
    this.isReady = false;
    this.isManualZoom = false;
  
    var that = this,
      loadingTask = pdfjsLib.getDocument({ url: node.url });

    loadingTask.onProgress = function (progressData) {
      that.progressBar.style.width = (progressData.loaded / progressData.total) * 100 + '%';
    };

    loadingTask.promise.then(function (pdf) {
      that.initPdf(pdf).then(function () {
        document.getElementById('zoom-in').addEventListener('click', function () { that.zoomIn(); });
        document.getElementById('zoom-out').addEventListener('click', function () { that.zoomOut(); });

        if (fullscreen.enabled()) {
          document.getElementById('full-screen').addEventListener('click', function () { 
            var el = document.getElementById('full-screen');

            that.isManualZoom = false;

            if (fullscreen.isFullscreen()) 
              fullscreen.exit()
              .then(function () { 
                el.textContent = 'Full screen ON';
                (that.node.isMobile ? document.documentElement : document.querySelector('.surface.supplemental')).scrollTop = that.lastScrollTop;
              });
            else {
              that.lastScrollTop = (node.isMobile ? document.documentElement : document.querySelector('.surface.supplemental')).scrollTop;

              fullscreen.request(that.viewerContainer)
              .then(function () { 
                el.textContent = 'Full screen OFF';
              }); 
            }
          });
        }

        that.setDragScrollHandler();

        window.addEventListener('deviceorientation', _.throttle(function () { that.onOrientationChange(); }, 200), false);

        var event = createCustomEvent('deviceorientation');
        setInterval(function () { window.dispatchEvent(event); }, 200);

        that.progressBar.style.display = 'none';
      });
    });
  };

  this.onOrientationChange = function () {
    this.isReady && !this.isManualZoom && this.calcAutoScale() && this.renderPage();
  }

  this.initPdf = function (pdf) {
    var that = this;

    return new Promise(function (resolve, reject) {
      pdf.getPage(1).then(function (page) {
        that.initPage(page).then(function () { resolve(); });
      });
    });
  }

  this.calcAutoScale = function(page) {
    page = page || this.pages[0].page;

    var viewport = page.getViewport({ scale: 1 }),
      wc = this.pagesContainer.clientWidth,
      hc = this.pagesContainer.clientHeight,
      wv = viewport.width,
      hv = viewport.height,
      dimension = ((wc / hc) < (wv / hv)) ? 'Width' : 'Height',    
      newScale = (this.pagesContainer['client' + dimension] - 32) / viewport[dimension.toLowerCase()],
      result = this.currentScale !== newScale;

    if (result) this.currentScale = newScale;

    return result;
  }

  this.initPage = function (page) {
    var that = this,
      canvas = document.createElement('canvas');

    canvas.classList.add('page');
    this.pagesContainer.appendChild(canvas);

    if (!this.pages.length) this.calcAutoScale(page);

    this.pages.push({
      page: page,
      canvas: canvas
    });

    return new Promise(function (resolve, reject) {
      that.renderPage().then(function () { resolve(); });
    });
  }

  this.renderPage = function (currentPage) {
    this.isReady = false;

    currentPage = currentPage || this.pages[0];

    var that = this,
      page = currentPage.page,
      canvas = currentPage.canvas,
      viewport = page.getViewport({ scale: this.currentScale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    return new Promise(function (resolve, reject) {
      page.render({
        canvasContext: canvas.getContext('2d'),
        viewport: viewport
      }).promise.then(function () { 
        that.isReady = true; 
        resolve(); 
      });
    });
  }

  this.zoomIn = function () {
    this.isManualZoom = true;

    if (this.currentScale < maxScale) this.currentScale *= scaleDelta;
    if (this.currentScale > maxScale) this.currentScale = maxScale;

    this.renderPage();
  }

  this.zoomOut = function () {
    this.isManualZoom = true;

    if (this.currentScale > minScale) this.currentScale /= scaleDelta;
    if (this.currentScale < minScale) this.currentScale = minScale;

    this.renderPage();
  }

  this.setDragScrollHandler = function () {
    var that = this,
      pages = that.pagesContainer,
      pushed, 
      lastClientX, 
      lastClientY,
      isTouch = 'ontouchstart' in window,
      startEvent = isTouch ? 'touchstart' : 'mousedown',
      endEvent = isTouch ? 'touchend' : 'mouseup',
      moveEvent = isTouch ? 'touchmove' : 'mousemove';

    pages.addEventListener(startEvent, function (e) {
      var d = isTouch ? e.changedTouches[0] : e;

      pushed = 1;
      lastClientX = d.clientX;
      lastClientY = d.clientY;

      isTouch || e.preventDefault();
      e.stopPropagation();
    }, 0);

    pages.addEventListener(endEvent, function (e) { pushed = 0; }, 0);

    pages.addEventListener(moveEvent, function (e) { 
      if (!pushed) return;

      var d = isTouch ? e.changedTouches[0] : e;

      pages.scrollLeft -= -lastClientX + (lastClientX = d.clientX);
      pages.scrollTop -= -lastClientY + (lastClientY = d.clientY);
    }, 0);
  }
};

InfographicView.Prototype.prototype = NodeView.prototype;
InfographicView.prototype = new InfographicView.Prototype();

module.exports = InfographicView;
