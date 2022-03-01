// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { TemplateBinding } from '../../KMN-varstack.js/bindings/bindings.js';
import InnerTextBinding from './inner-text-binding.js';
import InputBuilder from '../components/input-builder.js';

// @ts-ignore: description in global.d.ts works except for here
HTMLElement.prototype.$el = function element(opt) {
  opt = opt || {};
  let el = document.createElement(opt.tag || 'div');
  if (opt.cls) el.classList.add(opt.cls);
  this.appendChild(el);
  return el;
};

HTMLElement.prototype.$button = function addButton(str, onClick, cls) {
  let button = this.$el({ tag: 'button', cls });
  button.$setTextNode(str);
  button.onclick = onClick;
  return button;
}

HTMLElement.prototype.$toggleClass = function (name) {
  this.classList.toggle(name);
};

HTMLElement.prototype.$setVisible = function (val) {
  this.classList.toggle("hidden",!val)
};

HTMLElement.prototype.$isVisible = function () {
  return !this.classList.contains('hidden');
};

HTMLElement.prototype.$setSelected = function () {
  let parent = this.parentElement;
  for (let el of parent.children) {
    el.classList.toggle("selected", el === this);
  }
};

HTMLElement.prototype.$clearSelected = function () {
  let parent = this.parentElement;
  for (let el of parent.children) {
    el.classList.toggle("selected", false);
  }
};

HTMLElement.prototype.$removeChildren = function () {
  let el;
  while (el = this.firstChild) {
    el.remove();
  }
};

HTMLElement.prototype.$setTextNode = function(str) {
  this.$removeChildren();
  this.appendChild(document.createTextNode(str));
}

HTMLElement.prototype.$getClippingParent = function () {
  let el = this;
  while (el) {
    if (el.classList.contains('clip-gl')) {
      return el;
    }
    const overflow = getComputedStyle(el).overflow;
    if (overflow.indexOf('auto') !== -1 || overflow.indexOf('scroll') !== -1 || overflow.indexOf('hidden') !== -1) {
      return el;
    }
    el = el.parentElement;
  }
  return document.body;
};

function addCSS(id, cssStr) {
  let styleTag = document.getElementById(id);
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.setAttribute('id', id);
    styleTag.appendChild(document.createTextNode(cssStr));
    document.head.appendChild(styleTag);
  }
}

function updateCSS(id, cssStr) {
  let styleTag = document.getElementById(id);
  if (!styleTag) {
    addCSS(id, cssStr)
  } else {
    styleTag.$removeChildren();
    styleTag.appendChild(document.createTextNode(cssStr));
  }
}

function createInputs(element,rec) {
  let inputBuilder = new InputBuilder(element);
  inputBuilder.addRecord(rec);
  return inputBuilder;
}

function createTemplateLabel(element, template, record) {
  let binding = new TemplateBinding(template, record)
  return new InnerTextBinding(binding.baseVar, element);
}

export { createInputs, createTemplateLabel, addCSS, updateCSS }