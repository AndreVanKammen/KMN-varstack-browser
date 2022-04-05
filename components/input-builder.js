// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { BaseVar } from '../../KMN-varstack.js/vars/base.js';
import { RecordVar } from '../../KMN-varstack.js/structures/record.js';
import { CreateInputBinding } from '../utils/input-binding.js';
import { addCSS, kmnClassName } from '../utils/html-utils.js';
import InnerTextBinding from '../utils/inner-text-binding.js';

let labelUid = 0;
const nop = function () { };
const cssStr = /*css*/`
.${kmnClassName} tbody.input-table {
  height: 100%;
  overflow-y: auto;
  padding-top: 8px;
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
  padding-bottom: 8px;
  border-bottom: var(--borderWidth) solid var(--borderColor);
}
.${kmnClassName} td.isLabel {
  width: 33%;
}
.${kmnClassName} td.isValue { 
  text-align: right;
  font-size: smaller;
  width: 20%;
}
`;

class InputBuilder {
  /**
   * @param {HTMLElement} element
   * @param {object} options
   */
  constructor (element, options) {
    this.options = { ...{ onLabelClick:nop, onInputClick:nop },...(options || {})};
    this.table = element.$el({ tag: 'table', cls: 'input-table' });
    this.body = this.table.$el({ tag: 'tbody', cls: 'input-table' });
    if (this.options.vertical) {
      this.table.classList.add('vertical');
    }
    addCSS('input-builder', cssStr);
  }

  /**
   * @param {BaseVar} v
   * @param {string} [labelName]
   */
  addVar(v, labelName) {
    if (v instanceof RecordVar) {
      this.addRecord(v, labelName + '.');
      return;
    }

    labelName = labelName || v.$varDefinition.name;
    let labelId = 'i_' + (labelUid++);
    let row = this.body.$el({ tag: 'tr' });
    let label = row.$el({ tag: 'td', cls: 'isLabel' }).$el({ tag: 'label' });
    // let input = row.$el({ tag: 'td', cls: 'isInput' }).$el({ tag: 'input' });
    if (this.options.vertical) row = this.body.$el({ tag: 'tr' });
    let input = null;
    if (!this.options.hideInput) {
      input = new CreateInputBinding(v, row.$el({ tag: 'td', cls: 'isInput' }));
      input.parentElement.onclick = (event) => this.options.onInputClick(event, labelName, v);
      input.parentElement.setAttribute('id',labelId);
    }
    
    // input.classList.add(v.$varType);
    if (this.options.showValues) {
      if (this.options.vertical) row = this.body.$el({ tag: 'tr' });
      let value = row.$el({ tag: 'td', cls: 'isValue' });
      if (v.$varDefinition.showValue || this.options.hideInput) {
        new InnerTextBinding(v, value);
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
}

export default InputBuilder;