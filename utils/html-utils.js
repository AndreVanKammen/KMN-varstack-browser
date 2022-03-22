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
}
:root {
  --headerHeight: 42px;
  --tracksHeight: min(720px, 70%);

  --backgroundColor: rgb(32,32,32);

  --borderColor: rgb(0,0,0);
  --borderWidth: 2px;
  --borderWidth2: var(--borderWidth) * 2;
  --subBorderWidth: 1px;

  --tableBackground: rgb(20, 20, 20);
  --tableHeaderBackground: rgb(48, 48, 48);
  --tableHeaderColor: rgb(164, 164, 164);
  
  --headerBackground: rgb(0,0,0);
  --headerColor: rgb(192, 192, 192);

  --subHeaderBackground: rgb(76,76,76);
  --subHeaderColor: rgb(192,192,192);

  --activeColor: rgb(48,48,80);
  --activeHoverColor: rgb(62,62,192);
  
  --activeforeGroundColor: rgb(255, 255, 255);

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
  opacity: 0.3;
  vertical-align: middle;
  width: 100%;
}

input[type="checkbox"].${kmnClassName}:checked {
  opacity: 0.7;
}

input.${kmnClassName}:hover {
  outline: 1px solid var(--activeColor);
}

input.${kmnClassName}:focus {
  outline-style: solid;
}

input.${kmnClassName} {
  border: none;
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

/* tables, move to tablebuilder */
table.${kmnClassName} {
  position: absolute;
  display: block; /* if set to table firefox makes 100% the height of the whole table and scrollbar disapears */
  width: calc(100%);
  height: 100%;
  overflow: hidden;
  border-spacing: 1px;
}
table.${kmnClassName}:focus {
  outline-style: none;
}
tbody.${kmnClassName} {
  background: var(--tableBackground);
  overflow-x: auto;
  overflow-y: scroll;
  display: block;
  width: 100%;
  height: calc(100% - 25px);
}
tbody.${kmnClassName}.noHead {
  height: 100%;
}
thead.${kmnClassName} {
  background: var(--tableBackground);
  display: block;
  height: 26px;
  width: calc(100%);
}
thead.${kmnClassName} .filler {
  width: 3px;
}
tbody.${kmnClassName} tr, thead.${kmnClassName} tr {
 display: table;
 width: 100%;
 margin: 0;
 table-layout: fixed;
}
table.${kmnClassName} .nr {
  text-align: right;
  width: 30px;
}
table.${kmnClassName} th {
  padding: 3px 6px;
  background: var(--tableHeaderBackground);
  font-weight: normal;
  color: var(--tableHeaderColor);
}
tbody.${kmnClassName} tr:hover {
  /* background: var(--tableHoverColor); */
  outline: 1px solid var(--activeColor);
  cursor: pointer;
}
table.${kmnClassName} tr.selected {
  background: var(--activeColor);
}
table.${kmnClassName} td.showoverflow {
  overflow: visible;
}
table.${kmnClassName} td {
  white-space: nowrap;
  overflow: hidden;
  position: relative;
  padding: 1px 6px;
  border-radius: 3px;  
  /* min-width: 34px; */
  /* background: var(--codeBackground); */
}

/* No hovers on row anymore
table tr:hover td+.isInput {
  background: initial;
  cursor: pointer;
}
*/

table.${kmnClassName} td.isLabel {
  padding: 0;
}
table.${kmnClassName} label {
  display: block;
  width: calc(100% - 16px);
  /* height: calc(100% - 12px); */
  color: rgb(164,164,164);
  line-height: 100%;
  padding: 2px 8px;
  text-align: right;
}

th.${kmnClassName}.add,
th.${kmnClassName}.up,
th.${kmnClassName}.down,
th.${kmnClassName}.delete,
td.${kmnClassName}.none,
td.${kmnClassName}.up,
td.${kmnClassName}.down,
td.${kmnClassName}.delete {
  background: var(--activeColor);
  width: 24px;
  padding: 0;
  fill: none;
  stroke: rgb(128,128,128);
  stroke-width: 2px;
}
th.${kmnClassName}.add:hover,
td.${kmnClassName}.up:hover,
th.${kmnClassName}.up:hover,
td.${kmnClassName}.down:hover,
th.${kmnClassName}.down:hover,
td.${kmnClassName}.delete:hover {
  background: var(--activeHoverColor);
  stroke: white;
  stroke-width: 3px;
  fill: none;
}

/* Don't no why i need to do this to get the position ok */
th.${kmnClassName}.add svg {
  position: relative;
  left: -2px;
}

th.${kmnClassName}.add.active {
  background: var(--activeColor);
}
tr.${kmnClassName}.add-row {
  background: var(--activeColor);
  text-align: center;
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
  cursor: pointer;
  background: var(--codeBackground);
  color: var(--subHeaderColor);
  border: none;
  margin: 0;
  padding: 0;
  height: 24px;
}
button.${kmnClassName}.selected {
  background: var(--activeHoverColor);
  color: var(--activeforeGroundColor);
}
button.${kmnClassName}:hover {
  background: var(--activeHoverColor);
  color: var(--activeforeGroundColor);
}

.${kmnClassName}.comboDropdown {
  position: absolute;
  display: inline;
  background: navy;
  border: 2px solid var(--activeColor);
  border-top: none;
  right: 0;
  min-width: 240px;
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