"use strict";

var CompositeView = require("../composite/composite_view");
var List = require("./list");

// Substance.Image.View
// ==========================================================================

var ListView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

ListView.whoami = "SubstanceListView";


ListView.Prototype = function() {

  // Rendering
  // =============================
  //

  this.render = function() {
    this.el.innerHTML = "";

    switch ( this.node.list_type ) {
      case 'bulleted':
        this.content = document.createElement('UL');
        break;
      case 'ordered':
        this.content = document.createElement('OL');
        break;
      default:
        this.content = document.createElement('UL');
        this.content.classList.add('simple');
        break;
    }
    this.content.classList.add("content");

    var i;

    // dispose existing children views if called multiple times
    for (i = 0; i < this.childrenViews.length; i++) {
      this.childrenViews[i].dispose();
    }

    // create children views
    var labelIdx = 0;
    var children = this.node.getNodes();
    var lastEl;
    for (i = 0; i < children.length; i++) {
      var child = this.node.document.get(children[i]);
      var childView = this.viewFactory.createView(child);

      var listEl;
      if (child instanceof List) {
        var nestedListEl = childView.render().el;
        if( lastEl ) {
          if (lastEl.nodeName.toLowerCase() == 'li') {
            if (lastEl.parentElement.classList.contains('nested-level-1')) {
              nestedListEl.classList.add('nested-level-2');
            } else if (lastEl.parentElement.classList.contains('nested-level-2')) {
              nestedListEl.classList.add('nested-level-3');
            } else if (lastEl.parentElement.classList.contains('nested-level-3')) {
              nestedListEl.classList.add('nested-level-4');
            } else if (lastEl.parentElement.classList.contains('nested-level-4')) {
              nestedListEl.classList.add('nested-level-5');
            } else {
              nestedListEl.classList.add('nested-level-1');
            }
          }
          lastEl.appendChild(nestedListEl);
        }
      } else {
        listEl = document.createElement("LI");

        if ( this.node.labels[labelIdx] ) {
          var label = document.createElement('SPAN');
          label.classList.add('label');
          label.innerHTML = this.node.labels[labelIdx];
          listEl.appendChild(label);
        }
        ++labelIdx;

        listEl.appendChild(childView.render().el);
        lastEl = listEl;
      }
      if ( listEl ) {
        this.content.appendChild(listEl);
      }
      this.childrenViews.push(childView);
    }

    this.el.appendChild(this.content);
    return this;
  };

  this.onNodeUpdate = function(op) {
    if (op.path[0] === this.node.id && op.path[1] === "items") {
      this.render();
    }
  };
};

ListView.Prototype.prototype = CompositeView.prototype;
ListView.prototype = new ListView.Prototype();

module.exports = ListView;
