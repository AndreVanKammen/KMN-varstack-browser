

// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import PanelBase from '../../KMN-utils-browser/components/panel-base.js';
import InputBuilder from '../components/input-builder.js';
import { addCSS, kmnClassName } from '../utils/html-utils.js';

const cssStr = /*css*/`
.${kmnClassName} {
  --buttonAreaHeight: 26px;
}
.${kmnClassName}.buttonFooter {
  height: var(--buttonAreaHeight);
  bottom: 0;
}
.${kmnClassName}.buttonFooter .ok-button {
  position: absolute;
  width: 90px;
  right: 0;
}
.${kmnClassName}.buttonFooter .cancel-button {
  position: absolute;
  width: 90px;
  right: 100px;
}
.${kmnClassName}.inputRecordDiv {
  bottom: var(--buttonAreaHeight);
  height: calc(100% - var(--buttonAreaHeight));
}
`;

const defaultOptions = {
};
export class InputOkCancel extends PanelBase {
  constructor(options) {
    super(defaultOptions, options);

    this.searchTable = options.searchTable;
    this.searchTableEl = null;
    this.preferredWidth = 400;
    this.preferredHeight = 200;
  }

  /**
   * @param {HTMLElement} parentElement
   */
  initializeDOM(parentElement) {
    super.initializeDOM(parentElement);
    addCSS('input-ok-cancel', cssStr);
 
    this.buttonFooterDiv = this.parentElement.$el({ cls: "buttonFooter" });
    this.inputRecordDiv = this.parentElement.$el({ cls: "inputRecordDiv" });

    this.resolver = undefined;
    this.recordInputBuilder = new InputBuilder(this.inputRecordDiv, this.options);
    this.recordInputBuilder.addRecord(this.options.inputRecord);

    this.OKButton = this.buttonFooterDiv.$button('OK', (evt) => this.onOk(evt),'ok-button');
    this.CancelButton = this.buttonFooterDiv.$button('CANCEL', (evt) => this.onCancel(evt),'cancel-button');

    this.onOk = (evt) => { };
    this.onCancel = (evt) => { };
    this.onOk = this.options.onOk || this.onOk;
    this.onCancel = this.options.onCancel || this.onCancel;
  }

  /**
   * 
   * @param {() => void} onOk 
   * @param {() => void} onCancel 
   * @returns {boolean} Show succeeded
   */
  show(onOk = this.onOk, onCancel = this.onCancel) {
    this.onOk = onOk;
    this.onCancel = onCancel;
    return super.show();
  }
}
InputOkCancel.getTabName = () => 'INPUT-RECORD';
