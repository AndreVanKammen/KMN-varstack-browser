// Copyright by André van Kammen
// Licensed under CC BY-NC-SA
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import PanelBase from '../../KMN-utils-browser/components/panel-base.js';
import InputBuilder from '../components/input-builder.js';
import { TableBuilder } from '../components/table-builder.js';
import { addCSS, kmnClassName } from '../utils/html-utils.js';

const cssStr = /*css*/`
.${kmnClassName}.inputDiv {
  height: 100%;
}
.${kmnClassName}.inputDiv td.isLabel {
  width: 300px;
}
`

const defaultOptions = {
};
class InputPanel extends PanelBase {
  constructor(options) {
    super(defaultOptions, options);

    this.searchTable = options.searchTable;
    this.input = null;
  }

  /**
   * @param {HTMLElement} parentElement
   */
  initializeDOM(parentElement) {
    super.initializeDOM(parentElement);
    addCSS('input-panel',cssStr);

    this.inputDiv = this.parentElement.$el({ cls: "inputDiv" });

    this.input = new InputBuilder(
      this.inputDiv,
      {
        ...{
          showValues: true,
          showSubRecords: true,
          showTableValues: true
        },
        ...this.options
      });

    if (this.options.content) {
      this.input.addRecord(this.options.content);
    }
  }

  show() {
    let result = super.show();
    return result;
  }
}
InputPanel.getTabName = () => 'INPUT';

export default InputPanel;
