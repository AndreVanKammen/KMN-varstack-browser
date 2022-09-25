// Copyright by André van Kammen
// Licensed under CC BY-NC-SA
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { BaseBinding, BaseVar } from '../../KMN-varstack.js/vars/base.js';
import { RecordVar } from '../../KMN-varstack.js/structures/record.js';
import { CreateInputBinding } from '../utils/input-binding.js';
import { addCSS, kmnClassName } from '../utils/html-utils.js';
import { defaultTextBinding } from '../utils/inner-text-binding.js';
import { TableVar } from '../../KMN-varstack.js/structures/table.js';

let labelUid = 0;
const nop = function () { };
const cssStr = /*css*/`
.${kmnClassName} tbody.input-table {
  height: calc(100% - 2px);
  overflow-y: auto;
  padding-top: 2px;
}
.${kmnClassName} table.input-table.vertical td.isLabel {
  padding-top: 8px;
}
.${kmnClassName} table.input-table.vertical td {
  text-align: center;
}
.${kmnClassName} table.input-table.vertical label {
  text-align: center;
}
.${kmnClassName} table.input-table.vertical td.isInput {
  padding-bottom: 2px;
  border-bottom: var(--borderWidth) solid var(--borderColor);
}
.${kmnClassName} td.isLabel {
  width: 160px;
}
.${kmnClassName} td.isValue {
  text-align: right;
  font-size: smaller;
  width: 20%;
  margin-right: 16px;
}

.${kmnClassName} td.isInput {
  padding-left: 0;
  padding-right: 16px;
  margin: 0;
}
.${kmnClassName} td.isInput button {
  padding: 0 6px;
}
  */
.${kmnClassName} td.isInput button {
  padding: 2px 8px;
}
`;

const defaultOptions = {
  vertical: false,
  horizontal: false,
  hideInput: false,
  showValues: false,
  showSubRecords: false,
  showTableValues: false,
  onInputClick: (event, labelName, v) => { },
  onLabelClick: (event, labelName, v) => { }
}

class InputBuilder {
  /**
   * @param {HTMLElement} element
   * @param {Partial<typeof defaultOptions>} options
   */
  constructor (element, options = defaultOptions) {
    this.options = { ...defaultOptions,...(options || {})};
    this.table = element.$el({ tag: 'table', cls: 'input-table' });
    this.body = this.table.$el({ tag: 'tbody', cls: 'input-table' });
    if (this.options.vertical) {
      this.table.classList.add('vertical');
    }
    addCSS('input-builder', cssStr);
    /** @type {BaseBinding[]} */
    this.bindings = [];
  }

  /**
   * @param {BaseVar} v
   * @param {string} [labelName]
   */
  addVar(v, labelName) {
    if (v instanceof RecordVar) {
      if (this.options.showSubRecords) {
        this.addRecord(v, labelName + '.');
      }
      // Can't edit JSON in record, subFields are added anyway
      return;
    }

    if (v instanceof TableVar) {
      // TODO button with popup table view
      if (this.options.showTableValues) {
        for (let ix = 0; ix < v.length; ix++) {
          this.addRecord(v.element(ix), labelName + '[' + ix + '].');
        }
      }
      // this.addRecord(v, labelName + '.');
      // Can't edit JSON in record, subFields are added anyway
      return;
    }

    labelName = labelName || v.$varDefinition.name;
    let labelId = 'i_' + (labelUid++);
    let row = (this.options.horizontal) ? this.body : this.body.$el({ tag: 'tr' });
    let label = row.$el({ tag: 'td', cls: 'isLabel' }).$el({ tag: 'label' });
    // let input = row.$el({ tag: 'td', cls: 'isInput' }).$el({ tag: 'input' });
    if (this.options.vertical) row = this.body.$el({ tag: 'tr' });
    let input = null;
    if (!this.options.hideInput) {
      input = new CreateInputBinding(v, row.$el({ tag: 'td', cls: 'isInput' }));
      this.bindings.push(input);
      if (input.parentElement instanceof HTMLElement) {
        input.parentElement.onclick = (event) => this.options.onInputClick(event, labelName, v);
      }
      // @ts-ignore
      if (input.binding.element) {
        // @ts-ignore
        input.binding.element.setAttribute('id', labelId);
      }
    }

    // input.classList.add(v.$varType);
    if (this.options.showValues) {
      if (this.options.vertical) row = this.body.$el({ tag: 'tr' });
      let value = row.$el({ tag: 'td', cls: 'isValue' });
      if (v.$varDefinition.showValue || this.options.hideInput) {
        this.bindings.push(new defaultTextBinding(v, value))
      }
    }
    label.onclick = (event) => this.options.onLabelClick(event, labelName, v);
    label.innerText = labelName;
    label.setAttribute('for',labelId);
    // let dataBinding = new InputBinding(v, input);
    return {
      labelId,
      row,
      label,
      input
    }
  }

  /**
   * @param {RecordVar} rec
   */
  addRecord(rec, prefix = '') {
    for (var name of rec.$fieldNames) {
      let v = rec[name];
      if (v && v instanceof BaseVar) {
        this.addVar(v, prefix + name)
      }
    }
  }

  dispose() {
    for (let bnd of this.bindings) {
      bnd.dispose();
    }
    this.bindings = [];
    this.table.remove();
  }
}

export function createInputs(element,rec) {
  let inputBuilder = new InputBuilder(element);
  inputBuilder.addRecord(rec);
  return inputBuilder;
}

export default InputBuilder;