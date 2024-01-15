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
    const $article = $$('.related-article');

    const capitalizeWords = function (str) {
      return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    const articleType = capitalizeWords(this.node.properties.article_type);
    const $title = $$('.article-type');
    $title.appendChild($$('span', {text: articleType}));
    $article.appendChild($title);

    const requestData = {
      operation: "find_by_fields",
      article: {
        doi: this.node.properties.doi
      }
    };
    jQuery.ajax ({
      url: "https://rsuite.tech.area9innovation.com/search",
      type: "POST",
      data: JSON.stringify(requestData),
      contentType: "application/json;",
      success: function (data) {
        if (data.article.length == 0) {
          return;
        }
        const article = data.article[0];

        const $info = $$('.article-info');
        const link = 'reader.php?rsuite_id=' + article['Rsuite id'];
        if ('Title' in article) {
          const $el = $$('.article-title');
          $el.appendChild($$('a.article-title', {text: article['Title'], href: link}));
          $info.appendChild($el);
        }
        if ('Subtitle' in article) {
          const $el = $$('.article-subtitle');
          $el.appendChild($$('a.', {text: article['Subtitle'], href: link}));
          $info.appendChild($el);
        }
        if ('Authors' in article) {
          $info.appendChild($$('.article-authors', {text: article['Authors']}));
        }
        const citation = formatArticleCitation(
          article['Journal name'],
          article['Heading'],
          article['Day'], article['Month'], article['Year'],
          article['Volume'], article['Issue'],
          article['Journal id'] != 'jbjsam' ? article['Start page'] : article['Pages']
        );
        $info.appendChild($$('.article-citations', {text: citation}));
        $article.appendChild($info);
      }
    });

    $content.appendChild($article);
    this.content.appendChild($content);
    return this;
  };
};

function formatArticleCitation(journalName, heading, day2, month2, year, volume, issue, pages) {
  let month = -1;
  let day = '';

  if (month2) {
    const m = parseInt(month2);
    if (m >= 1 && m <= 12) {
      month = m;
    }
  }
  if (day2) {
    if (parseInt(day2) > 0) {
      day = ' ' + day2;
    }
  }
  let fullDate = '';
  if (month !== -1 && year !== '') {
    fullDate = new Date(year, month - 1, 10).toLocaleString('en-US', { month: 'long' }) + day + ', ' + year;
  } else if (year !== '') {
    fullDate = year;
  }

  let citation = journalName.replace(/[^a-zA-Z0-9\s]/g, '');

  if (volume.toLowerCase() === 'publish ahead of print') {
    citation += ', ' + volume;
  } else {
    citation += ', ' + volume + '(' + issue + '):' + pages;
  }

  citation += ' | ' + heading + ' | ' + fullDate;

  return citation;
}

RelatedArticleView.Prototype.prototype = NodeView.prototype;
RelatedArticleView.prototype = new RelatedArticleView.Prototype();

module.exports = RelatedArticleView;
