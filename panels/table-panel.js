// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import PanelBase from '../../KMN-utils-browser/components/panel-base.js';
import { Types } from '../../KMN-varstack.js/varstack.js';
import InputBuilder from '../components/input-builder.js';
import TableBuilder from '../components/table-builder-v2.js';
// import TableBuilder from '../components/table-builder.js';
import { addCSS, kmnClassName } from '../utils/html-utils.js';

const cssStr = /*css*/`
.${kmnClassName} {
  --tableSearchHeaderHeight: 0px;
}
.${kmnClassName}.tableSearchHeader {
  height: var(--tableSearchHeaderHeight);
}
.${kmnClassName}.tableSearchTableDiv {
  top: var(--tableSearchHeaderHeight);
  height: calc(100% - var(--tableSearchHeaderHeight));
}
`

const defaultOptions = {
};
class TablePanel extends PanelBase {
  constructor(options) {
    super(defaultOptions, options);

    this.searchStr = new Types.String();
    this.searchStr.$addEvent( (x) => this.filterShaders(x.$v) );
    this.searchField = options.searchField || 'name'

    this.searchTable = options.searchTable;
    this.searchTableEl = null;
  }

  filterShaders(value) {
    let reg = new RegExp(value,'i');
    this.searchTableEl.setFilter(
      (ix, rec) => {
        return reg.test(rec.$findVar(this.searchField)?.$v) 
      });
  }

  /**
   * @param {HTMLElement} parentElement
   */
  initializeDOM(parentElement) {
    super.initializeDOM(parentElement);
    addCSS('table-search',cssStr);
 
    this.synthSearchHeaderDiv = this.parentElement.$el({ cls: "tableSearchHeader" });
    this.synthSearchTableDiv = this.parentElement.$el({ cls: "tableSearchTableDiv" });

    this.searchInputBuilder = new InputBuilder(this.synthSearchHeaderDiv);
    this.searchInput = this.searchInputBuilder.addVar(this.searchStr,'SEARCH');

    this.searchTableEl = new TableBuilder(
      this.synthSearchTableDiv, 
      this.searchTable,
      {
        ...{
          // fieldNames: this.options.fieldNames,
          // alternativeBindings: this.options.alternativeBindings,
          // headerNames: this.options.headerNames,
          // inlineEdit: this.options.inlineEdit,
          // onRowSelect: this.options.onRowSelect,
          // onRowClick: this.options.onRowClick,
          sortOnHeaderClick: true,
          showFilterEdits: true
        },
        ...this.options
      });
  }

  show() {
    let result = super.show();
    this.searchInput.input.parentElement.focus();
    return result;
  }
}
TablePanel.getTabName = () => 'TABLE-SEARCH';

export default TablePanel;
