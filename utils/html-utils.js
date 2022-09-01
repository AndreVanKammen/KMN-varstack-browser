// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

export let kmnClassName = 'kmn';
// TODO: Move stuff from here to class who uses it
const defaultCSS = /*css*/`

div.${kmnClassName} {
  position: absolute;
  display: inline-block;
  margin: 0;
  padding: 0;
  outline: none;
  width: 100%;
  height: 100%;
  font-family: Arial, Helvetica, sans-serif;
  scrollbar-width: thin;
  user-select: none;
  box-sizing: border-box;
  font-weight: normal;
  font-size: 16px;
  line-height: 1.0;
  letter-spacing: normal;
}
:root {
  --headerHeight: 42px;
  --tracksHeight: min(720px, 70%);

  --backgroundColor: rgb(32,32,32);

  --splitter-size: 4px;
  --borderColor: rgb(0,0,0);
  --borderWidth: 2px;
  --borderWidth2: var(--borderWidth) * 2;
  --subBorderWidth: 1px;

  --tableBackground: rgb(20, 20, 20);
  --tableHeaderBackground: rgb(32, 32, 32);
  --tableHeaderColor: rgb(164, 164, 164);
  
  --tableHeaderHeight: 26px;

  --headerBackground: rgb(0,0,0);
  --headerColor: rgb(192, 192, 192);

  --subHeaderBackground: rgb(40,40,40);
  --subHeaderColor: rgb(192,192,192);

  --activeColor: rgb(54,54,54);
  /*--activeHoverColor: rgb(62,62,192);*/
  --activeHoverColor: rgb(255,255,3);
  --activeforeHoverColor: rgb(18,18,18);
  
  --activeforeGroundColor: rgb(255,255,255);

  --scrollBarThumb: rgb(64,64,64);
}

/* Change scrollbar */
::-webkit-scrollbar-track
{
  width:8px;
  background-color: rgba(0,0,0,0);
}
tbody::-webkit-scrollbar-track
{
  width:8px;
  background-color: var(--backgroundColor);
}
::-webkit-scrollbar
{
  width:16px;
  background-color: rgba(0,0,0,0);
}
::-webkit-scrollbar-corner {
  background-color: rgba(0,0,0,0);
}

::-webkit-scrollbar-thumb
{
  border: 3px solid rgb(32, 32, 32, 0.95); /* var(--backgroundColor); */
  border-radius: 15px;
  cursor: pointer;
  background-color: var(--scrollBarThumb);
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    /* display: none; <- Crashes Chrome on hover */
    -webkit-appearance: none;
    margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
}

input[type="date"]::-webkit-calendar-picker-indicator {
  padding:6px 0 0 0;
  margin:0;
  position:relative;
  display:block;
  left: unset;
  filter: brightness(0.8);
  cursor: pointer;
  height: 100%;
  right: 0;
  top: 0;
  width: 16px;
}

input[type=number] {
    -moz-appearance:textfield; /* Firefox */
}
/*
  Default components
*/
select.${kmnClassName} {
  height: 100%;
  background: var(--activeColor);
  font: inherit;
  color: inherit;
  border: none;
  border-right: 1px solid black;

  outline: none;
  padding: 2px 12px;
  line-height: 100%;
}

option.${kmnClassName} {
  background: var(--codeBackground);
  /* ITS BEEN DECADES, BUT STILL THIS UNSTYLE-ABLE SELECT,
     SO NO HTML 5 DOES NOT ROCK UNTIL IT FINALLY HAS DECENT 
     BASIC CONTROLS (AND HTML 5 IS STILL NOT FULLY IMPLEMENTED AFTER YEARS)
  height: 100px;
  padding: 100px;
  margin: 100px; */
  font: inherit;
  color: inherit;
  border: none;
  outline: none;
}

input[type="checkbox"].${kmnClassName} {
  vertical-align: middle;
  width: 24px;
  margin: 0;
  accent-color: var(--subHeaderBackground);
}

input[type="checkbox"].${kmnClassName}:checked {
  accent-color: var(--activeColor);
  opacity: 0.7;
}

input.${kmnClassName}:hover {
  outline: 1px solid var(--activeColor);
}

input.${kmnClassName}:focus {
  outline-style: solid;
}

textarea.${kmnClassName},
input.${kmnClassName} {
  border: none;
  color-scheme: dark;
  background: rgb(0,0,0,0.25);
  color: var(--headerColor);
  font: inherit;
  padding: 1px 4px 1px 4px;
  height: 20px;
  margin: 0 6px;
  width: calc(100% - 12px);
  outline-color: var(--activeColor);
  outline-width: 2px;
}
textarea.${kmnClassName} {
  width:100%;
  height:120px;
}


/*
  Other content
*/
.${kmnClassName}.overlayCanvas {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: 5;

  pointer-events: none;

  image-rendering: optimizeSpeed;
}

.${kmnClassName}.hidden {
  display: none !important;
}

.${kmnClassName}.fullscreen {
  position: fixed;
  top: 0;
  left:  0;
  z-index: 100;
}

button.${kmnClassName} {
  outline: none;
  cursor: pointer;
  background: var(--activeColor);
  color: var(--subHeaderColor);
  border: none;
  border-radius: 8px;
  margin: 0;
  padding: 0;
  height: 24px;
  border: 1px solid transparent;
}
button.${kmnClassName}:hover {
  background: var(--activeHoverColor);
  color: var(--activeforeHoverColor);
}
button.${kmnClassName}.selected {
  background: var(--activeColor);
  color: var(--activeforeGroundColor);
  border: 2px solid yellow;
}

.${kmnClassName}.drop-down-list {
  position: fixed;
  display: inline-block;
  background: navy;
  border: 2px solid var(--activeColor);
  border-top: none;
  max-width: 240px;
  height: 240px;
  z-index: 10;
}
`;
let defaultCSSAdded = false;

// @ts-ignore: description in global.d.ts works except for here
HTMLElement.prototype.$el = function element(opt) {
  opt = opt || {};
  let el = document.createElement(opt.tag || 'div');
  el.classList.add(kmnClassName);
  if (opt.cls) el.classList.add(opt.cls);
  this.appendChild(el);
  if (!defaultCSSAdded) {
    addCSS('kmn-defaults', defaultCSS, true);
  }
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

HTMLElement.prototype.$hasFocus = function () {
  return document.activeElement === this && document.hasFocus();
};
HTMLElement.prototype.$setSelected = function () {
  let parent = this.parentElement;
  for (let el of parent.children) {
    el.classList.toggle("selected", el === this);
  }
};

HTMLElement.prototype.$clearSelected = function () {
  for (let el of this.children) {
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
    if (overflow.indexOf('auto') !== -1 || overflow.indexOf('scroll') !== -1 ||
      (overflow.indexOf('hidden') !== -1 && el !== this)) {
      return el;
    }
    el = el.parentElement;
  }
  return document.body;
};

function addCSS(id, cssStr, before = false) {
  id = 'kmn-' + id;
  let styleTag = document.getElementById(id);
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.setAttribute('id', id);
    styleTag.appendChild(document.createTextNode(cssStr));
    if (before) {
      for (let child of document.head.children) {
        if (child.tagName === 'STYLE') {
          document.head.insertBefore(styleTag, child);
          return
        }
      }
    }
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

function createKMNElement(tagName) {
  let el = document.createElement(tagName);
  el.classList.add(kmnClassName);
  return el;
}

export {  addCSS, updateCSS, createKMNElement }