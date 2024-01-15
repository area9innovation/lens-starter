"use strict";

var NodeView = require("../node").View;
var $$ = require("../../../substance/application").$$;


// Substance.RelatedArticle.View
// ==========================================================================

var RelatedArticleView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.$el.addClass('level-'+this.node.level);
};

RelatedArticleView.Prototype = function() {

  this.render = function() {
    NodeView.prototype.render.call(this);

    const capitalizeWords = function (str) {
      return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    const title = capitalizeWords(this.node.properties.article_type);
    const titleEl = $$('div.title', {text: title});
    this.content.appendChild(titleEl);

    const doi = this.node.properties.doi;
    // const xmlUrl = `https://tech.area9innovation.com/jbjs/hub/pages/reader.php?doi=${doi}&show-xml=1`
    // $.get(xmlUrl).done(function(data){
    //   console.log(data)
    // })

    // // Heading title
    // var titleView = this.createTextPropertyView([this.node.id, 'content'], {
    //   classes: 'title'
    // });

    // if (this.node.label) {
    //   var labelEl = $$('.label', {text: this.node.label});
    //   this.content.appendChild(labelEl);
    // }

    // this.content.appendChild(titleView.render().el);
    return this;
  };

  // this.renderTocItem = function() {
  //   var el = $$('div');
  //   if (this.node.label) {
  //     var labelEl = $$('.label', {text: this.node.label});
  //     el.appendChild(labelEl);
  //   }
  //   var titleEl = $$('span');
  //   this.renderAnnotatedText([this.node.id, 'content'], titleEl);
  //   el.appendChild(titleEl);
  //   return el;
  // };

};

RelatedArticleView.Prototype.prototype = NodeView.prototype;
RelatedArticleView.prototype = new RelatedArticleView.Prototype();

module.exports = RelatedArticleView;
