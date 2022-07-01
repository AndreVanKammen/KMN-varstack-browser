// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import svgIcon from "../../KMN-utils-browser/svg-icons.js";
import log from "../../KMN-varstack.js/core/log.js";
import { RecordVar } from "../../KMN-varstack.js/structures/record.js";
import { TableView } from "../../KMN-varstack.js/structures/table-view.js";
import { ArrayTableVar, TableVar } from "../../KMN-varstack.js/structures/table.js";
import { BaseVar } from "../../KMN-varstack.js/vars/base.js";
import { addCSS, kmnClassName } from "../utils/html-utils.js";
import InnerTextBinding from "../utils/inner-text-binding.js";
import { CreateInputBinding } from "../utils/input-binding.js";

const cssStr = /*css*/`
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
  position: relative;
  overflow-x: auto;
  overflow-y: scroll;
  display: block;
  width: 100%;
  height: calc(100% - var(--tableHeaderHeight));
}
tbody.${kmnClassName}.noHead {
  height: 100%;
}
thead.${kmnClassName} {
  background: var(--tableBackground);
  display: block;
  height: var(--tableHeaderHeight);
  width: calc(100%);
}

div.${kmnClassName}.filter-input {
  position: relative;
  display: inline-block;
  height: 26px;
}

div.${kmnClassName}.selected-div {
  position: absolute;
  display: inline-block;
  top: 0px;
  height: auto;
}

table.${kmnClassName}.filter {
  --tableHeaderHeight: 78px;
}

thead.${kmnClassName} .filler {
  width: 3px;
}
tbody.${kmnClassName} tr, thead.${kmnClassName} tr {
 display: table;
 width: calc(100% - 1px);
 margin: 0;
 table-layout: fixed;
 vertical-align: top;
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
  overflow: hidden;
} 
table.${kmnClassName} th.selected {
  background: var(--activeColor);
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
`;
/**
 * @template {RecordVar} R 
 * @template {import('../../../TS/data-model').ArrayTableVarG<R>} T 
 * @type {import('../../../TS/table-builder').TableBuilderG<T,R>}
 */
class TableBuilder {
  /**
   * 
   * @param {HTMLElement} element 
   * @param {import('../../../TS/data-model').ArrayTableVarG<R>} table 
   * @param {import('../../../TS/table-builder').TableBuilderOptions<import('../../../TS/table-builder').ArrayTableType<T>>} options 
   */
  constructor(element, table, options) {
    this.table = table;
    this.options = options || {};
    this.options.alternativeBindings = this.options.alternativeBindings || {};

    addCSS('table-builder', cssStr, true);
    this.fieldNames = this.options.fieldNames;
    this.tableEl = element.$el({ tag: "table", cls: table.constructor.name });
    this.tableEl.setAttribute("tabindex", '1');
    this.tableEl.onkeydown = this.handleKeyPress.bind(this);
    this.tableEl.onblur = this.handleFocusChange.bind(this);
    this.tableEl.onfocus = this.handleFocusChange.bind(this);

    this.rowCache = {};
    this.htmlRows

    this.selectedRec = null;
    this.selectedIx = -1;
    this.rowHeight = 16;// TODO Make dynamic

    if (!this.options.skipHeader) {
      this.thead = this.tableEl.$el({ tag: "thead" });
      this.headRow = this.thead.$el({ tag: "tr" });
      this.tbody = this.tableEl.$el({ tag: "tbody" });
    } else {
      this.tbody = this.tableEl.$el({ tag: "tbody" });
      this.tbody.classList.add('noHead');
    }
    this.tbody.classList.add('clip-gl');

    if (this.fieldNames) {
      const allNames = this.table.elementType.prototype._fieldNames;
      for (let name of this.fieldNames) {
        if (allNames.indexOf(name) === -1) {
          // TODO check names with .
          if (name.indexOf(".") === -1) {
            throw "FieldName not found: " + name;
          }
        }
      }
    } else {
      this.fieldNames = this.table.elementType.prototype._fieldNames;
    }
    this.bindings = {};
    for (let ix = 0; ix < this.fieldNames.length; ix++) {
      this.bindings[ix] =
        this.options.alternativeBindings[ix] || (this.options.inlineEdit ? CreateInputBinding : InnerTextBinding)
    }
    this.tableView = new TableView(this.table);
    this.table.addArrayChangeEvent(this.handleTableArrayChange.bind(this));

    if (this.headRow) {
      this.updateHeader();
    }
    this.updateTable();

    this.onRowSelect = this.options.onRowSelect;
    this.onRowClick = this.options.onRowClick;
    this.onRowDblClick = this.options.onRowDblClick;
  }

  /**
   * 
   * @param {HTMLTableRowElement} row 
   * @param {keyof HTMLElementTagNameMap} tagName
   * @param {RecordVar} rec 
   * @param {String} name 
   * @param {String} pathData 
   * @param {(rec: RecordVar) => void} func 
   */
   addFunc(row, tagName, rec, name, pathData, func) {
    let el = row.$el({ tag: tagName, cls: name });
    el.appendChild(svgIcon(pathData));
    el.onclick = (evt) => {
      evt.stopPropagation();
      func.call(this, rec);
    };
   }
  
  handleKeyPress(evt) {
    // TODO scroll into view
    if (evt.key === 'ArrowDown') {
      let sortIx = this.sortArray.indexOf(this.selectedIx);
      if (sortIx >= 0 && sortIx < this.sortArray.length - 1) {
        evt.preventDefault();
        evt.stopPropagation();
        let ix = this.sortArray[sortIx + 1];
        this.selectRow(this.table.array[ix], ix);
      }
      // for (let ix = this.selectedIx + 1; ix < this.htmlRows.length; ix++) {
      //   if (this.htmlRows[ix].$isVisible()) {
      //     evt.preventDefault();
      //     evt.stopPropagation();
      //     this.selectRow(this.table.array[ix], ix);
      //     break;
      //   }
      // }
    } else if (evt.key === 'ArrowUp') {
      let sortIx = this.sortArray.indexOf(this.selectedIx);
      if (sortIx > 0 ) {
        evt.preventDefault();
        evt.stopPropagation();
        let ix = this.sortArray[sortIx - 1];
        this.selectRow(this.table.array[ix], ix);
      }
      // for (let ix = this.selectedIx - 1; ix >= 0; ix--) {
      //   if (this.htmlRows[ix].$isVisible()) {
      //     evt.preventDefault();
      //     evt.stopPropagation();
      //     this.selectRow(this.table.array[ix], ix);
      //     break;
      //   }
      // }
    } else if (evt.key === 'Enter') {
      this.handleRowClick(this.selectedRec, this.selectedIx);
    } else if (evt.key === 'Escape') {
      this.tableEl.blur();
    }
    // console.log(evt);
  }

  updateHeader() {
    if (!this.fieldNames) {
      log.error("No fields");
    }
    this.headRow.$removeChildren();
    if (this.options.showFilterEdits) {
      // TODO: clean up previous versions
      this.filterRec = new this.table.elementType;
      this.filterRec2 = new this.table.elementType;
      this.filterRec.$parent = this.table;
      this.filterRec2.$parent = this.table;
      this.tableEl.classList.add('filter');
    }
    for (let ix = 0; ix < this.fieldNames.length; ix++) {
      let fieldName = this.fieldNames[ix];
      let headerName = fieldName;
      if (this.options.headerNames && this.options.headerNames[ix]) {
        headerName = this.options.headerNames[ix];
      }
      let headerElement = this.headRow.$el({ tag: "th", cls: headerName.replaceAll(' ', '-') });
      headerElement.innerText = headerName;
      if (this.options.showFilterEdits) {
        if (!this.tableView) {
          this.tableView = new TableView(this.table);
        }
        let inpDiv = headerElement.$el({ cls: 'filter-input' });
        let baseVar = this.filterRec.$findVar(fieldName);
        let baseVar2 = this.filterRec2.$findVar(fieldName);
        // Give the var it's own definition
        baseVar.$setDefinition(baseVar.$varDefinition);
        baseVar.$varDefinition.isReadOnly = false;
        if (baseVar.$varDefinition.inputType === 'range') {
          baseVar.$varDefinition.inputType = 'number';
        }
        baseVar.$varDefinition.directInput = true;
        let inputElement = new CreateInputBinding(baseVar, inpDiv);
          
        baseVar.$addDeferedEvent(() => {
          // Only if we are sorted on it to prevent filtering on setting min max
          if (this.tableView.sortField === fieldName) {
            headerElement.$setSelected();
            this.tableView.setFilter(fieldName, baseVar.$sortValue, baseVar2.$sortValue);
            this.updateTable();
          }
        });

        let fieldIx = this.table.elementType.prototype._fieldNames.indexOf(fieldName);
        if (fieldIx >= 0 && this.table.elementType.prototype._fieldDefs[fieldIx].sortIsNumber) {
          // Give the var it's own definition
          baseVar2.$setDefinition(baseVar2.$varDefinition);
          baseVar2.$varDefinition.isReadOnly = false;
          baseVar2.$addDeferedEvent(() => {
            // Only if we are sorted on it to prevent filtering on setting min max
            if (this.tableView.sortField === fieldName) {
              headerElement.$setSelected();
              this.tableView.setFilter(fieldName, baseVar.$sortValue, baseVar2.$sortValue);
              this.updateTable();
            }
          });
          if (baseVar2.$varDefinition.range) {
            baseVar.$v = baseVar2.$varDefinition.range[0];
            baseVar2.$v = baseVar2.$varDefinition.range[1];
          }
          if (baseVar2.$varDefinition.inputType === 'range') {
            baseVar2.$varDefinition.inputType = 'number';
          }
          let inputElement2 = new CreateInputBinding(baseVar2, inpDiv);
        }
        
        if (this.options.sortOnHeaderClick) {
          headerElement.onclick = (evt) => {
            console.log(evt);
              headerElement.$setSelected();
            if (evt.target === headerElement) {
              this.tableView.setSort(fieldName);
            } else {
              this.tableView.setSort(fieldName,this.tableView.sortAscending);
            }
            this.tableView.setFilter(fieldName, baseVar.$sortValue, baseVar2.$sortValue);
              this.updateTable();
          }
        }
        // @ts-ignore
        // inputElement.binding.element?.onfocus = () => { 
        //   headerElement.oncli
        // };
      } else {

        if (this.options.sortOnHeaderClick) {
          headerElement.onclick = (evt) => {
            console.log(evt);
            if (evt.target === headerElement) {
              headerElement.$setSelected();
              this.tableView.setSort(fieldName);
              this.updateTable();
            }
          }
        }
      }
    }

    this.addButton = null;
    if (this.options.editList) {
      this.addFunc(this.headRow, 'th', null, "up", "M4,16L12,8L20,16", this.moveRowUp);
      this.addFunc(this.headRow, 'th', null, "down", "M4,8L12,16L20,8", this.moveRowDown);
      this.addButton = this.headRow.$el({ tag: "th", cls: "add" });
      // this.addButton.width = "20px";
      this.addButton.appendChild(svgIcon("M12,4v16M4,12h16"));
      this.addButton.onclick = this.handleAdd.bind(this);
    }

    // Add filler for scrollbar header
    this.headRow.$el({ tag: "th", cls: "filler" }).innerText = " ";
  }

  handleAdd() {
    // if (!this.addMode) {
      if (this.options.addClick) {
        this.options.addClick()
      }
      // this.addMode = true;
      // this.addButton.classList.add("active");
      // this.addRow = this.tbody.$el({ tag: "tr", cls: "add-row" });
      // // TODO: get effects word from table or options
      // this.addRow.innerText = "click effect to add here!";
    // }
  }

  handleFocusChange() {
    console.log('this.isFocussed = ', document.activeElement === this.tableEl);
    let newIsFocussed = document.activeElement === this.tableEl;
    if (this.isFocussed !== newIsFocussed) {
      this.isFocussed = newIsFocussed
      if (this.options.onFocusChange) {
        this.options.onFocusChange();
      }
      this.updateSelectedDiv();
    }

  //   setTimeout(() => {
  //     if (this.addMode) {
  //       console.log("focus lost!");
  //       // Rescedule to happen after click in table
  //       this.addButton.classList.remove("active");
  //       this.addMode = false;
  //       this.addRow.remove();
  //     }
  //   }, 250);
  }

  updateSelectedDiv() {
    if (!this.selectedDiv) {
      return;
    }
    let showSelectedDiv = false;
    if (this.lastSelectedRow) {
      this.lastSelectedRow.style.height = 'unset';
    }
    if (this.selectedIx !== -1 && this.isFocussed) {
      let rowEl = this.htmlRows[this.selectedIx];
      if (rowEl) {
        let totalHeight = this.selectDivHeight + this.rowHeight;
        let topVal = (rowEl.offsetTop + this.rowHeight);
        // console.log('Set top: ', topVal, this.selectedIx, this.tbody.scrollHeight, rowEl.offsetTop);
        this.selectedDiv.style.top = topVal.toFixed(0) + 'px';
        showSelectedDiv = true;
        rowEl.style.height = totalHeight + 'px';
        this.lastSelectedRow = rowEl;
      }
    }
    this.selectedDiv.$setVisible(showSelectedDiv);
  }
  selectRow(rec, ix = -1) {
    if (ix === -1) {
      if (!rec) {
        this.selectedRec = undefined;
        this.selectedIx = -1;
        this.tbody.$clearSelected();
        return;
      }
      ix = this.table.findIxForElement(rec);
    } 
    if (0 > ix || ix >= this.htmlRows.length) {
      log.error("Index out of bound in selectRow");
    }
    if (!rec) {
      rec = this.table.element(ix);
    }
    // Selected is not in table (filtered)
    if (!this.htmlRows[ix]) {
      if (this.htmlRows.length) {
        this.tbody.$clearSelected();
      }
      return;
    }
    this.htmlRows[ix].$setSelected();
    this.htmlRows[ix].scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
    this.selectedRec = rec;
    this.selectedIx = ix;
    if (this.onRowSelect) {
      this.onRowSelect(rec, ix);
    }
    this.updateSelectedDiv();
  }

  handleRowClick(rec, ix) {
    this.selectRow(rec, ix);
    if (this.onRowClick) {
      this.onRowClick(rec, ix);
    }
  }

  handleRowDblClick(rec, ix) {
    this.selectRow(rec, ix);
    if (this.onRowDblClick) {
      this.onRowDblClick(rec, ix);
    }
  }

  moveRowUp(rec) {
    if (!rec) {
      rec = this.selectedRec;
    }
    if (rec) {
      let isSelected = (rec === this.selectedRec);
      this.table.moveUp(rec);
      if (isSelected) {
        this.selectRow(rec);
      }
    }
  }

  moveRowDown(rec) {
    if (!rec) {
      rec = this.selectedRec;
    }
    if (rec) {
      let isSelected = (rec === this.selectedRec);
      this.table.moveDown(rec);
      if (isSelected) {
        this.selectRow(rec);
      }
    }
  }

  deleteRow(rec) {
    this.table.remove(rec);
  }

  /**
   * @param {HTMLTableRowElement} row
   * @param {R} rec
   */
  _fillRow(row, rec) {
    let bindings = [];
    for (let ix = 0; ix < this.fieldNames.length; ix++) {
      // this.fieldNames.forEach((x) => {
      let fieldName = this.fieldNames[ix];
      let headerName = this.fieldNames[ix];
      if (this.options.headerNames && this.options.headerNames[ix]) {
        headerName = this.options.headerNames[ix];
      }
      let tdEl = row.$el({ tag: "td", cls: headerName.replaceAll(' ','-') });
      let field = rec.$findVar(fieldName);
      if (field) {
        let bindingIx = bindings.push(new this.bindings[ix](field, tdEl))-1;
        // TODO make better
        let changeDef = rec['_' + fieldName + '_def'];
        if (changeDef) {
          changeDef.$addDeferedEvent(() => {
            bindings[bindingIx].remove();
            bindings[bindingIx] = new this.bindings[ix](rec.$findVar(fieldName), tdEl);
          });
        }
      } else {
        tdEl.innerText = "-";
      }
    }
    if (this.options.editList) {
      // TODO better detection for top row, this won't work with filter or sort
      // if (ix <= 0) {
      //   addFunc("none", "", () => { });
      // } else {
      this.addFunc(row,'td',rec,"up", "M4,16L12,8L20,16", this.moveRowUp);
      //}
      // TODO better detection for bottom row, this won't work with filter or sort
      // if (ix >= this.table.array.length - 1) {
      //   addFunc("none", "", () => { });
      // } else {
      this.addFunc(row,'td',rec,"down", "M4,8L12,16L20,8", this.moveRowDown);
      // }
      this.addFunc(row,'td',rec,"delete", "M4,4L20,20M20,4L4,20", this.deleteRow);
    }
    // @ts-ignore: TODO other way to handle cleanup
    row.dataForCleanup = {
      bindings
    }
  }

  updateTable() {
    this.htmlRows = [];
    // TODO: check if this leaks memory through the textbindings

    this.tbody.$removeChildren();
    this.sortArray = this.tableView.getSortArray();

    let minMax = {};

    for (let sortIx = 0; sortIx < this.sortArray.length; sortIx++) {
      let ix = this.sortArray[sortIx];
      let rec = this.table.array[ix];

      let row = this.rowCache[rec.$hash];
      if (row) {
        this.tbody.appendChild(row);
      } else {
        row = this.tbody.$el({ tag: "tr" });
        this._fillRow(row, rec);
        this.rowCache[rec.$hash] = row;
      }

      if (this.filterRec) {
        for (let fieldName of this.fieldNames) {
          let fieldIx = this.table.elementType.prototype._fieldNames.indexOf(fieldName);
          if (fieldIx !== -1 && this.table.elementType.prototype._fieldDefs[fieldIx].sortIsNumber) {
            if (sortIx === 0) {
              minMax[fieldName] = {
                min: rec.$findVar(fieldName).$v,
                max: rec.$findVar(fieldName).$v
              }
            } else {
              minMax[fieldName].min = Math.min(minMax[fieldName].min, rec.$findVar(fieldName).$v);
              minMax[fieldName].max = Math.max(minMax[fieldName].max, rec.$findVar(fieldName).$v);
            }          }
        }
      }

      row.onclick = this.handleRowClick.bind(this, rec, ix);
      row.ondblclick = this.handleRowDblClick.bind(this, rec, ix);
      this.htmlRows[ix] = row;
    }
    if (this.filterRec) {
      for (let fieldName of this.fieldNames) {
        let fieldIx = this.table.elementType.prototype._fieldNames.indexOf(fieldName);
        if (fieldIx !== -1 && this.table.elementType.prototype._fieldDefs[fieldIx].sortIsNumber && minMax[fieldName]) {
          this.filterRec.$findVar(fieldName).$v = minMax[fieldName].min;
          this.filterRec2.$findVar(fieldName).$v = minMax[fieldName].max;
        }
      }
    }

    if (this.options.emptyRowForAdd) {
      if (!this.newRec) {
        this.newRec = new this.table.elementType;
        this.newRec.$parent = this.table;
        this.newRec.$setDefinition(this.table.elementDef);
        let addEvent = null
        addEvent = this.newRec.$addDeferedEvent(() => {
          this.newRec.$removeEvent(addEvent);
          this.table.add(this.newRec);
          this.newRec = null;
          this.updateTable();
        })
      }
      let row = this.rowCache[this.newRec.$hash];
      if (row) {
        this.tbody.appendChild(row);
      } else {
        row = this.tbody.$el({ tag: "tr" });
        this._fillRow(row, this.newRec);
        this.rowCache[this.newRec.$hash] = row;
      }
      // row.onclick = this.handleRowClick.bind(this, rec, ix);
      this.htmlRows.push(row);
    }
    if (this.options.initSelectedDiv) {
      this.selectedDiv = this.tbody.$el({ cls: 'selected-div' });
      this.selectDivHeight = this.options.initSelectedDiv(this, this.selectedDiv);
      this.updateSelectedDiv()
    }
  }

  handleTableArrayChange() {
    this.updateTable();
  }

  setFilter(fieldNameOrFunction, values) {
    if (typeof fieldNameOrFunction === "function") {
      for (let ix = 0; ix < this.htmlRows.length; ix++) {
        this.htmlRows[ix].$setVisible(
          fieldNameOrFunction(ix, this.table.array[ix])
        );
      }
    } else {
      for (let ix = 0; ix < this.htmlRows.length; ix++) {
        const rec = this.table.array[ix]
        this.htmlRows[ix].$setVisible(
          // TODO use something like Hash<value> from c# for performance
          rec && values.indexOf(rec[fieldNameOrFunction].$v) !== -1
        );
      }
    }
  }

  clearFilter() {
    for (let ix = 0; ix < this.htmlRows.length; ix++) {
      this.htmlRows[ix].$setVisible(true);
    }
  }
}

export default TableBuilder;