// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import PanelBase from '../../KMN-utils-browser/components/panel-base.js';
import { Types } from '../../KMN-varstack.js/varstack.js';
import InputBuilder from '../components/input-builder.js';
import TableBuilder from '../components/table-builder.js';
import { addCSS } from '../utils/html-utils.js';

const cssStr = `/*css*/
:root {
  --tableSearchHeaderHeight: 26px;
}
.tableSearchHeader {
  height: var(--tableSearchHeaderHeight);
}
.tableSearchTableDiv {
  top: var(--tableSearchHeaderHeight);
  height: calc(100% - var(--tableSearchHeaderHeight));
}
/*!css*/`

const defaultOptions = {
};
class TableSearch extends PanelBase {
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
        fieldNames: this.options.fieldNames,
        alternativeBindings: this.options.alternativeBindings,
        inlineEdit: this.options.inlineEdit,
        onRowSelect: this.options.onRowSelect,
        onRowClick: this.options.onRowClick
      });
  }

  show() {
    super.show();
    this.searchInput.input.focus();
  }
}
TableSearch.getTabName = () => 'TABLE-SEARCH';

export default TableSearch;
