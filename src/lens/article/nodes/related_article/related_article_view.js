"use strict";

var NodeView = require("../node").View;
var $$ = require("../../../substance/application").$$;


// Substance.RelatedArticle.View
// ==========================================================================

var RelatedArticleView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);
};

RelatedArticleView.Prototype = function() {
  this.render = function() {
    NodeView.prototype.render.call(this);

    const $content = $$('.related-articles');

    const articles = this.node.properties.articles;
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

  if (article.title) {
    const $el = $$('.article-title');
    $el.appendChild($$('a', {text: article.title, href: article.reader_link}));
    $info.appendChild($el);
  }
  
  if (article.subtitle) {
    const $el = $$('.article-subtitle');
    $el.appendChild($$('a', {text: article.subtitle, href: article.reader_link}));
    $info.appendChild($el);
  }
  
  if (article.authors) {
    const $el = $$('.article-authors.text-with-ellipsis.one-line', {text: article.authors});
    $info.appendChild($el);
  }
  
  const logo = `<img src="${article.logo_url}">`
  const $citations = $$('.article-citations', {html: logo + article.citation});
  $info.appendChild($citations);

  return $info;
}

RelatedArticleView.Prototype.prototype = NodeView.prototype;
RelatedArticleView.prototype = new RelatedArticleView.Prototype();

module.exports = RelatedArticleView;
