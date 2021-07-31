// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import PanelBase from '../../KMN-utils-browser/components/panel-base.js';
import { Types } from '../../KMN-varstack.js/varstack.js';
import InnerTextBinding from '../../KMN-varstack-browser/utils/inner-text-binding.js';
import { addCSS } from '../../KMN-varstack-browser/utils/html-utils.js';
import GlslEditor from '../../KMN-utils-browser/glsl-editor.js';

const cssStr = `/*css*/
:root {
  --codeHeaderHeight: 22px;
}
.glslElement {
  position: absolute;
  border: 0;
  outline: 0;
  margin: 0;
  resize: none;
  top: calc(var(--codeHeaderHeight));
  width: 100%;
  height: calc(100% - var(--codeHeaderHeight));
}
.codeHeader {
  position: absolute;
  overflow: hidden;
  border-bottom: var(--subBorderWidth) solid var(--borderColor);
  border-right: var(--subBorderWidth) solid var(--borderColor);
  color: var(--subHeaderColor);
  background: var(--tableHeaderBackground);
  height: calc(var(--codeHeaderHeight) - var(--subBorderWidth));
  width: calc(100% - 24px);
  padding: 1px 12px;
}
.codeTitle {
  position: absolute;
  overflow: hidden;
  top: 3px;
  left: 12px;
  height: calc(var(--codeHeaderHeight) - var(--subBorderWidth));
}
.codeCompile {
  position: absolute;
  right: -1px;
  color: var(--subHeaderColor);
  background: var(--activeColor);
  outline: none;
  border: none;
  margin: -1px 2px;
  padding: 3px 12px;
  text-align: center;
  justify-content: center;
  font: inherit;
}
.codeCompile:hover {
  background: var(--activeHoverColor);
  color: white;
}
/*!css*/`

class CodeEditor extends PanelBase {

  constructor(options) {
    super({}, options);
    // this.options = { ...defaultOptions, ...options };
    this.glslEditor = new GlslEditor({
      onCompile: this.handleCompile.bind(this)});
  }
  
  /**
   * @param {HTMLElement} parentElement
   */
  initializeDOM(parentElement) {
    super.initializeDOM(parentElement);
    addCSS('code-editor', cssStr);

    // this.parentElement = parentElement; 
    this.parentElement.classList.add('code');
    // TODO add classes codeArea code

    this.headerElement = document.createElement('div');

    this.glslElement = this.parentElement.$el({ cls: 'glslElement' });
    this.glslEditor.initializeDOM(this.glslElement);

    // Header need to be added last for fixed to work in css
    this.headerElement.classList.add('codeHeader');
    this.titleElement = this.headerElement.$el({ cls: 'codeTitle' });
    this.headerName = new Types.String();
    this.headerNameBinding = new InnerTextBinding(this.headerName, this.titleElement);
    this.compileElement = this.headerElement.$el({ tag: 'button', cls: 'codeCompile' });
    this.compileElement.$setTextNode('COMPILE');

    this.compileElement.onclick = () => {
      this.handleCompile()
    };
    this.parentElement.appendChild(this.headerElement);

    this.options.shaderVar.$addEvent(this.handleShaderChanged.bind(this));
    this.handleShaderChanged();
  }

  handleCompile() {
    const codeEditorSource = this.glslEditor.getSource();
    const compileInfo = this.options.onCompile(
      this.options.typeVar.$v,
      this.options.nameVar.$v, 
      codeEditorSource, {});

    this.glslEditor.setStatus(compileInfo, codeEditorSource);
    if (compileInfo.compileStatus) {
      if (this.options.shaderVar) {
        this.options.shaderVar.$v = codeEditorSource;
      }
    }
  }

  handleShaderChanged() {
    this.loadSource(
      this.options.nameVar.$v,
      this.options.shaderVar.$v);
  }

  loadSource(name, source) {
    this.headerName.$v = name;
    this.source = source;
    this.glslEditor.loadSource(this.source);
  }
}
CodeEditor.getTabName = () => 'CODE';

export default CodeEditor;
