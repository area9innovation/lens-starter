"use strict";

var Workflow = require('lens/reader/workflows/workflow');

var TableScaling = function() {
  Workflow.apply(this, arguments);
};

TableScaling.Prototype = function() {
  this.handlesStateUpdate = true;
  this.pass = 0;
  this.scroll = 0;

  this.registerHandlers = function() {
  };

  this.unRegisterHandlers = function() {
    $(window).off("resize", this.DoScaling);
  };

  this.handleStateUpdate = function(state, stateInfo) {
    ++this.pass;
    if ( this.pass > 1 ) return;

    $('body *').not('.video-wrapper *').css('position', 'unset');
    $('body').css('position', 'unset');  
    $('body').css('overflow', 'auto');  
    $('#container').css('height', 'auto');  
    $('#forlens').css('position', 'relative');  

    var popup = $('<div id="popup" class="lens-article"></div>').css({
      display: 'none',
      position: 'fixed',
      left: 0,
      top: 0,
      'z-index': 5000,
      'background-color': 'white',
      width: '100%',
      height: '100%',
    });

    $(popup).on('click', function(){
      $(popup).css('display', 'none');
    });

    $('body').append(popup);

    var store = this;

    this.DoScroll(store);

    this.DoScaling(store);

    $(window).on("resize", function() { store.DoScaling(store); } );
    $(window).on("scroll", function() { store.DoScroll(store); } );

    var panzoomWheel = this.PanzoomWheel;
    var panzoomEnd = this.PanzoomEnd;

    $('.image-wrapper').children('img').on('click', function(){
      var img = $(document.createElement('img')).css({
        'max-width': '100%',
        'max-height': '100%',
        position: 'absolute',
        margin: 'auto',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }).prop('src', this.src);

      $('#popup').empty().append('<div>');

      $('#popup div').css('height', '100%').append(img);

      $('#popup div').on('click', function(){
        $(popup).css('display', 'none');
      });

      $('#popup').css('display', 'block');
      $('#popup').children().children().panzoom({
        which: 2,
        minScale: 1,
        panOnlyWhenZoomed: true,
        contain: 'automatic',
      });

      var $panzoom = $('#popup').children().children().panzoom();
      $panzoom.parent().on('mousewheel.focal', function( e ) {
        panzoomWheel( e, $panzoom);
      });

      $panzoom.on('panzoomend', panzoomEnd);
    });

    $('.table-wrapper').on('click', function(){
      var tableBlock = $(this).parent().parent().clone();

      $(tableBlock).find('.focus-handle').remove();
      $(tableBlock).find('.footers').remove();
      
      $(tableBlock).find('table').css({
        'transform-origin': 'inherit',
        transform: 'scale(1)',
        });

      $('#popup').empty().append(tableBlock);
      $('#popup').css('display', 'block');
      $('#popup *').css('overflow','hidden');  
      $('#popup').css('overflow','auto');  

      var p = $('#popup').height();
      var t = $('#popup').find('table').outerHeight(true);

      if ( t > p ) {
        var scale = (p - 60 ) / t;
        var oScale = p / t;
        $('#popup').find('table').css({
          'transform-origin': '0 0 0',
          transform: 'scale(' + scale  + ')',
        });

        $('#popup').find('table').parent().css({
          height: $('#popup').find('table').outerHeight() * scale,
          width: $('#popup').find('table').outerWidth() * scale,
          margin: 'auto',
        });
      } else {
        $('#popup').find('table').parent().height($('#popup').find('table').outerHeight());
        $('#popup').children().children().height($('#popup').height());  
      }

      $('#popup').children().children().panzoom({
        which: 2,
        minScale: 1,
        panOnlyWhenZoomed: true,
        contain: 'automatic',
      });

      var $panzoom = $('#popup').children().children().panzoom();
      $panzoom.parent().on('mousewheel.focal', function( e ) {
        panzoomWheel( e, $panzoom);
      });

      $panzoom.on('panzoomend', panzoomEnd);
    });

    return false;
  };

  this.DoScaling = function(store) {

    $('#main .table-wrapper').each(function(){

      var pw = $(this).width();
      var tw = $(this).children('table').width();
      if ( tw > pw ) {
        var wScale = pw / (tw + 4);
        var hScale = pw / tw;

        $(this).css('overflow', 'hidden');
        
        $(this).children('table')
          .css('transform-origin', 'left top')
          .css('transform', 'scale(' + wScale + ')');

        $(this).height($(this).children('table').outerHeight() * hScale + 5);

      } else {
        
        $(this).css('overflow', 'auto');

        $(this).children('table').css('transform', 'scale(1)');

        $(this).height($(this).children('table').outerHeight() + 5);
      }

    });

    $(window).scrollTop(store.scroll*$('.nodes').outerHeight());
  };

  this.PanzoomWheel = function(e, $panzoom) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    $panzoom.panzoom('zoom', zoomOut, {
      increment: 0.1,
      animate: false,
      focal: e
    });
  };

  this.PanzoomEnd = function( e, panzoom, matrix, changed ) {
    if ( !changed ) {
      $('#popup').css('display', 'none');
    }
  };

  this.DoScroll = function(store) {
    store.scroll = $(window).scrollTop()/$('.nodes').outerHeight(); 
  }
};

TableScaling.Prototype.prototype = Workflow.prototype;
TableScaling.prototype = new TableScaling.Prototype();

module.exports = TableScaling;

