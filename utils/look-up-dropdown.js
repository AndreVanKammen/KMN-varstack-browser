import { TableBuilder } from "../components/table-builder.js";
import { addCSS, kmnClassName } from "./html-utils.js";

/** @type {Record<string,TableBuilder>} */
const tableViewCache = {};

const cssStr = /*css*/`
.${kmnClassName}.drop-down-area {
  position: fixed;
  display: block;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
}
.${kmnClassName}.drop-down-element {
  position: absolute;
  display: block;
  width: auto;
  height: auto;
  min-width: 240px;
  min-height: 320px;
  color: var(--subHeaderColor);
}
`;

export class LookUpDropdown {
  constructor(tableVar, lookUpFieldName, showFieldName) {
    addCSS('lookup-dropdown-area', cssStr);
    this.lookUpFieldName = lookUpFieldName;
    this.showFieldName = showFieldName;

    /** @type {HTMLDivElement} */ /* @ts-ignore: this is annoying */
    this.dropDownArea = document.querySelector('.drop-down-area');
    if (!this.dropDownArea) {
      this.dropDownArea = document.body.$el({ tag: 'div', cls: 'drop-down-area' });
      this.dropDownArea.$setVisible(false);
    }

    let tableViewKey = tableVar.$hash + '_' + showFieldName;
    this.tableBuilder = tableViewCache[tableViewKey];
    if (this.tableBuilder) {
      this.dropDownElement = this.tableBuilder.parentElement;
    } else {
      this.dropDownElement = this.dropDownArea.$el({ cls: 'drop-down-element' });
      this.tableBuilder = new TableBuilder(this.dropDownElement, tableVar, {
        fieldNames: [this.showFieldName],
        skipHeader: true
      });
      tableViewCache[tableViewKey] = this.tableBuilder;
      this.dropDownElement.$setVisible(false);
    }
  }

  show(baseVar, x, y) {
    this.baseVar = baseVar;

    if (!this.dropDownElement.$isVisible()) {
      this.dropDownArea.$setVisible(true);
      this.dropDownElement.$setVisible(true);
    }
    this.dropDownElement.style.left = x.toFixed(2)+'px';
    this.dropDownElement.style.top = y.toFixed(2)+'px';

    // tableView.tableEl.onfocus = null;
    this.tableBuilder.tableEl.focus();
    // tableView.tableEl.onfocus = element.onfocus;
    this.tableBuilder.tableEl.onblur = () => {
      this.dropDownElement.$setVisible(false);
      this.dropDownArea.$setVisible(false);
    };
    this.tableBuilder.onRowClick = (rec) => {
      this.baseVar.$v = rec[this.lookUpFieldName].$v;
      this.dropDownElement.$setVisible(false);
      this.dropDownArea.$setVisible(false);
    };
    // tableView.updateTable();
    let ix = this.tableBuilder.table.findIx(this.lookUpFieldName, this.baseVar.$v);
    if (ix !== -1) {
      this.tableBuilder.selectRow(null, ix);
    }
  }
}
