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

    const $content = $('.related-article');

    const capitalizeWords = function (str) {
      return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    const articleType = capitalizeWords(this.node.properties.article_type);
    const $title = $$('.article-type', {text: articleType});
    $content.appendChild($title);

    var requestData = {
      operation: "find_by_fields",
      article: {
        doi: this.node.properties.doi
      }
    };
    $.post("https://rsuite.tech.area9innovation.com/search", JSON.stringify(requestData), function(data, status) {
      console.log('response data', data)
      let article = data.article;
      article = article[0] !== undefined ? article[0] : article;

      const $info = $$('.article-info');
      $info.appendChild([
        $$('.article-title', article['Title']),
        $$('.article-subtitle', article['Subtitle']),
      ])
      $content.appendChild($info);
    });

    this.content.appendChild($content);
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
