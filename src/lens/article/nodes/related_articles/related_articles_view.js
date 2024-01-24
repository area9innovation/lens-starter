"use strict";

var NodeView = require("../node").View;
var $$ = require("../../../substance/application").$$;


// Substance.RelatedArticles.View
// ==========================================================================

var RelatedArticlesView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);
};

RelatedArticlesView.Prototype = function() {
  this.render = function() {
    NodeView.prototype.render.call(this);

    const $content = $$('.related-articles-box');

    const articles = this.node.properties.articles;
    if (!articles.length) {
      return this;
    }
    
    articles.sort((a, b) => a.heading < b.heading ? -1 : 1);
    for (let i = 0; i < articles.length; i++) {
      const $article = $$('.related-article');
      const article = articles[i];

      if (i == 0 || articles[i-1].heading != article.heading) {
        const $title = $$('.heading', {html: '<i class="fa fa-link"></i>' + article.heading});
        $article.appendChild($title);
      }

      $article.appendChild(createArticleInfoBlock(article));
      $content.appendChild($article);
    }

    this.content.appendChild($content);
    return this;
  };
};

function createArticleInfoBlock(article) {
  const $info = $$('.article-info');

  const $title = $$('a.article-title', {html: article.title, href: article.reader_link});
  if (article.subtitle) {
    $title.appendChild($$('span.subtitle', {html: '<br>' + article.subtitle}));
  }
  $info.appendChild($title);
  
  if (article.authors) {
    const $el = $$('.article-authors.text-with-ellipsis.one-line', {text: article.authors});
    $info.appendChild($el);
  }
  
  const logo = `<img src="${article.logo_url}">`
  const $citations = $$('.article-citations', {html: logo + article.citation});
  $info.appendChild($citations);

  return $info;
}

RelatedArticlesView.Prototype.prototype = NodeView.prototype;
RelatedArticlesView.prototype = new RelatedArticlesView.Prototype();

module.exports = RelatedArticlesView;
