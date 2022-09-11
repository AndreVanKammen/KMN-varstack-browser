// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import PanelBase from '../../KMN-utils-browser/components/panel-base.js';
import TableBuilder from '../components/table-builder-v2.js';
// import TableBuilder from '../components/table-builder.js';
import { addCSS, kmnClassName } from '../utils/html-utils.js';

const cssStr = /*css*/`
.${kmnClassName}.tableDiv {
  height: 100%;
}
`

const defaultOptions = {
};
class TablePanel extends PanelBase {
  constructor(options) {
    super(defaultOptions, options);

    this.searchTable = options.searchTable;
    this.tableBuilder = null;
  }

  /**
   * @param {HTMLElement} parentElement
   */
  initializeDOM(parentElement) {
    super.initializeDOM(parentElement);
    addCSS('table-panel',cssStr);
 
    this.tableDiv = this.parentElement.$el({ cls: "tableDiv" });

    this.tableBuilder = new TableBuilder(
      this.tableDiv, 
      this.searchTable,
      {
        ...{
          sortOnHeaderClick: true,
          showFilterEdits: true
        },
        ...this.options
      });
  }

  show() {
    let result = super.show();
    return result;
  }
}
TablePanel.getTabName = () => 'TABLE';

export default TablePanel;
