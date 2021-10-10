// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import svgIcon from "../../KMN-utils-browser/svg-icons.js";
import log from "../../KMN-varstack.js/core/log.js";
import { RecordVar } from "../../KMN-varstack.js/structures/record.js";
import { ArrayTableVar, TableVar } from "../../KMN-varstack.js/structures/table.js";
import { BaseBinding, BaseVar } from "../../KMN-varstack.js/vars/base.js";
import InnerTextBinding from "../utils/inner-text-binding.js";
import { CreateInputBinding } from "../utils/input-binding.js";

/**
 * Abstaction for HTML elements, want to be able to replace it with other (shader) stuff
 */
class RectElement {
  /**
   * 
   * @param {TableBuilder} owner
   * @param {ColumnInfo} column 
   * @param {RowInfo} row 
   * @param {BaseVar} v
   */
  constructor(owner, column, row, v, bindingType) {
    this._owner = owner;
    this._column = column;
    this._row = row;
    this._var = v;
    this._element = null; // this._owner.parentElement.$el({ tag: 'div' });
    this._binding = null;
  }

  update() {
    if (!this._element) {
      this._element = this._owner.parentElement.$el({ tag: 'div' });
    }
    if (!this._binding) {
      // @ts-ignore Youre annoying sometimes!
      this._binding = new this._column._defaultBinding(this._var, this._element);
      // TODO Implement variable bindings
      // let changeDef = rec['_' + fieldName + '_def'];
      // if (changeDef) {
      //   changeDef.$addEvent(() => {
      //     bindings[bindingIx].remove();
      //     bindings[bindingIx] = new this.bindings[ix](rec.$findVar(fieldName), tdEl);
      //   });
      // }
    }
    this._element.style.left = this._column._x + 'px';
    this._element.style.width = this._column._width + 'px';
    this._element.style.top = this._row._y + 'px';
    this._element.style.height = this._row._height + 'px';
  }
}

class RowInfo {
  constructor(y, height) {
    this._y = y;
    this._height = height;
    this._visible = true;
    this._selected = false;

    /** @type {RectElement[]} */
    this.cells = [];
  }

  get visible() {
    return this._visible;
  }

  set visible(x) {
    this._visible = x;
  }

  get selected() {
    return this._selected;
  }

  set selected(x) {
    this.selected = x;
  }
}

class ColumnInfo {
  /**
   * @param {TableBuilder} owner
   * @param {Number} x
   * @param {String} fieldName 
   * @param {String} headerName 
   * @param {typeof BaseBinding} defaultBinding 
   */
  constructor(owner, x, fieldName, headerName, defaultBinding) {
    this._owner = owner;
    this._fieldName = fieldName;
    this._headerName = headerName;
    this._defaultBinding = defaultBinding;
    this._x = x;
    this._width = 100;
  }
}

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
    this.fieldNames = this.options.fieldNames;

    this._rowHeight = 25;

    this.parentElement = element;

    // TODO: global key and pointer handler
    // this.tableEl.onkeydown = this.handleKeyPress.bind(this);

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

    this.selectedRec = null;
    this.selectedIx = -1;

    // /** @type {RowInfo} */
    this.headerRow = null;

    // /** @type {RowInfo[]} */
    this.rows = [];

    /** @type {Record<Number,RowInfo>} */
    this.rowCache = {}
    
    if (!this.options.skipHeader) {
      this.headerRow = new RowInfo(0, this._rowHeight);
    }
 
    /** @type {ColumnInfo[]} */
    this.columns = [];
    let currentX = 0;
    for (let ix = 0; ix < this.fieldNames.length; ix++) {
      let fieldName = this.fieldNames[ix];
      let headerName = this.fieldNames[ix];
      if (this.options.headerNames && this.options.headerNames[ix]) {
        headerName = this.options.headerNames[ix];
      }
      this.columns.push(new ColumnInfo(
        this,
        currentX,
        fieldName,
        headerName,
        this.options.alternativeBindings[ix] || (this.options.inlineEdit ? CreateInputBinding : InnerTextBinding)));
      currentX += 120;
    }

    this.table.addArrayChangeEvent(this.handleTableArrayChange.bind(this));

    this.updateTable();

    this.onRowSelect = this.options.onRowSelect;
    this.onRowClick = this.options.onRowClick;
  }

  handleKeyPress(evt) {
    // TODO scroll into view
    if (evt.key === 'ArrowDown') {
      for (let ix = this.selectedIx + 1; ix < this.rows.length; ix++) {
        if (this.rows[ix].visible) {
          evt.preventDefault();
          evt.stopPropagation();
          this.selectRow(this.table.array[ix], ix);
          break;
        }
      }
    } else if (evt.key === 'ArrowUp') {
      for (let ix = this.selectedIx - 1; ix >= 0; ix--) {
        if (this.rows[ix].visible) {
          evt.preventDefault();
          evt.stopPropagation();
          this.selectRow(this.table.array[ix], ix);
          break;
        }
      }
    } else if (evt.key === 'Enter') {
      this.handleRowClick(this.selectedRec, this.selectedIx);
    }
  }

  updateHeader() {
    if (!this.fieldNames) {
      log.error("No fields");
    }
    for (let ix = 0; ix < this.fieldNames.length; ix++) {
      let fieldName = this.fieldNames[ix];
      let headerName = fieldName;
      if (this.options.headerNames && this.options.headerNames[ix]) {
        headerName = this.options.headerNames[ix];
      }
      // this.headRow.$el({ tag: "th", cls: headerName }).innerText = headerName;
    }

    // this.addButton = null;
    // if (this.options.editList) {
    //   this.headRow.$el({ tag: "th", cls: "up" }).width = "20px";
    //   this.headRow.$el({ tag: "th", cls: "down" }).width = "20px";
    //   this.addButton = this.headRow.$el({ tag: "th", cls: "add" });
    //   // this.addButton.width = "20px";
    //   this.addButton.appendChild(svgIcon("M12,4v16M4,12h16"));
    //   this.addButton.onclick = this.handleAdd.bind(this);
    // }

    // // Add filler for scrollbar header
    // this.headRow.$el({ tag: "th", cls: "filler" }).innerText = " ";
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

  // handleFocusLoss() {
  //   setTimeout(() => {
  //     if (this.addMode) {
  //       console.log("focus lost!");
  //       // Rescedule to happen after click in table
  //       this.addButton.classList.remove("active");
  //       this.addMode = false;
  //       this.addRow.remove();
  //     }
  //   }, 250);
  // }

  selectRow(rec, ix = -1) {
    if (ix === -1) {
      ix = this.table.findIxForElement(rec);
    } 
    if (0 > ix || ix >= this.rows.length) {
      log.error("Index out of bound in selectRow");
    }
    if (!rec) {
      rec = this.table[ix];
    }
    if (this.selectedIx !== -1) {
      this.rows[this.selectedIx].selected = true;
    }
    this.rows[ix].selected = true;
    // this.htmlRows[ix].scrollIntoView({ behavior: "auto", block: "nearest",inline: "nearest"});
    this.selectedRec = rec;
    this.selectedIx = ix;
    if (this.onRowSelect) {
      this.onRowSelect(rec, ix);
    }
  }

  handleRowClick(rec, ix) {
    this.selectRow(rec, ix);
    if (this.onRowClick) {
      this.onRowClick(rec, ix);
    }
  }

  moveRowUp(rec) {
    this.table.moveUp(rec);
  }

  moveRowDown(rec) {
    this.table.moveDown(rec);
  }

  deleteRow(rec) {
    this.table.remove(rec);
  }

  /**
   * @param {RowInfo} row
   * @param {R} rec
   */
  _fillRow(row, rec) {
    for (let ix = 0; ix < this.columns.length; ix++) {
      let column = this.columns[ix];
      let fieldName = column._fieldName;
      let field = rec.$findVar(fieldName);
      if (field) {
        let cell = new RectElement(this, column, row, field);
        row.cells.push(cell);
      }
    }
    // TODO
    // if (this.options.editList) {
    //   const addFunc = (name, pathData, func) => {
    //     let el = row.$el({ tag: "td", cls: name });
    //     el.appendChild(svgIcon(pathData));
    //     el.onclick = (evt) => {
    //       evt.stopPropagation();
    //       func.call(this, rec);
    //     };
    //   };
    // }
  }


  updateTable() {
    this.rows = [];
    let currentY = 0;
    for (let ix = 0; ix < this.table.array.length; ix++) {
      let rec = this.table.array[ix];
      let row = this.rowCache[rec.$hash];
      if (row) {
        row._y = currentY;
      } else {
        row = new RowInfo(currentY, this._rowHeight);
        this._fillRow(row, rec);
        this.rowCache[rec.$hash] = row;
      }
      this.rows.push(row);
      currentY += this._rowHeight;
    }
    for (let ix = 0; ix < this.rows.length; ix++) {
      let row = this.rows[ix];
      for (let jx = 0; jx < row.cells.length; jx++) {
        let cell = row.cells[jx];
        cell.update();
      }
    }
    // TODO clean unused rows

      // this.htmlRows = [];
    // TODO: beter partial update, this one leaks memory through the textbindings

    // this.tbody.$removeChildren();
    // for (let ix = 0; ix < this.table.array.length; ix++) {
    //   let rec = this.table.array[ix];

    //   let row = this.rowCache[rec.$hash];
    //   if (row) {
    //     this.tbody.appendChild(row);
    //   } else {
    //     row = this.tbody.$el({ tag: "tr" });
    //     this._fillRow(row, rec);
    //     this.rowCache[rec.$hash] = row;
    //   }
    //   row.onclick = this.handleRowClick.bind(this, rec, ix);
    //   this.htmlRows.push(row);
    // }
    // if (this.options.inlineEdit) {
    //   if (!this.newRec) {
    //     this.newRec = new this.table.elementType;
    //     this.newRec.$parent = this.table;
    //     this.newRec.$setDefinition(this.table.elementDef);
    //     let addEvent = null
    //     addEvent = this.newRec.$addEvent(() => {
    //       this.newRec.$removeEvent(addEvent);
    //       this.table.add(this.newRec);
    //       this.newRec = null;
    //       this.updateTable();
    //     })
    //   }
    //   let row = this.rowCache[this.newRec.$hash];
    //   if (row) {
    //     this.tbody.appendChild(row);
    //   } else {
    //     row = this.tbody.$el({ tag: "tr" });
    //     this._fillRow(row, this.newRec);
    //     this.rowCache[this.newRec.$hash] = row;
    //   }
    //   // row.onclick = this.handleRowClick.bind(this, rec, ix);
    //   this.htmlRows.push(row);
    // }
  }

  handleTableArrayChange() {
    this.updateTable();
  }

  setFilter(fieldNameOrFunction, values) {
    if (typeof fieldNameOrFunction === "function") {
      for (let ix = 0; ix < this.rows.length; ix++) {
        this.rows[ix].visible = fieldNameOrFunction(ix, this.table.array[ix]);
      }
    } else {
      for (let ix = 0; ix < this.rows.length; ix++) {
        const rec = this.table.array[ix]
        this.rows[ix].visible = rec && values.indexOf(rec[fieldNameOrFunction].$v) !== -1;
      }
    }
  }

  clearFilter() {
    for (let ix = 0; ix < this.rows.length; ix++) {
      this.rows[ix].visible = true;
    }
  }
}

export default TableBuilder;