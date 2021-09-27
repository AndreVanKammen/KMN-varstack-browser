// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { BaseVar } from '../../KMN-varstack.js/vars/base.js';
import { RecordVar } from '../../KMN-varstack.js/structures/record.js';
import { CreateInputBinding } from '../utils/input-binding.js';
import { addCSS } from '../utils/html-utils.js';
import InnerTextBinding from '../utils/inner-text-binding.js';

let labelUid = 0;
const nop = function () { };
const cssStr = /*css*/`/*css*/
tbody.input-table {
  height: 100%;
}
td.isLabel {
  width: 33%;
}
td.isValue { 
  text-align: right;
  font-size: smaller;
  width: 15%;
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
    addCSS('input-builder', cssStr);
  }

  /**
   * @param {BaseVar} v
   * @param {string} [labelName]
   */
  addVar(v, labelName) {
    labelName = labelName || v.$varDefinition.name;
    let labelId = 'i_' + (labelUid++);
    let row = this.body.$el({tag:'tr'});
    let label = row.$el({tag:'td', cls:'isLabel'}).$el({tag:'label'});
    // let input = row.$el({ tag: 'td', cls: 'isInput' }).$el({ tag: 'input' });
    let input = new CreateInputBinding(v, row.$el({ tag: 'td', cls: 'isInput' }));
    // input.classList.add(v.$varType);
    if (this.options.showValues) {
      let valueText = row.$el({ tag: 'td', cls: 'isValue' });
      new InnerTextBinding(v, valueText);
    }
    label.onclick = (event) => this.options.onLabelClick(event, labelName, v);
    input.parentElement.onclick = (event) => this.options.onInputClick(event, labelName, v);
    label.innerText = labelName;
    label.setAttribute('for',labelId);
    input.parentElement.setAttribute('id',labelId);
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
  addRecord(rec, overrideTypes) { 
    for (var name of rec.$fieldNames) {
      let v = rec[name];
      if (v && v instanceof BaseVar) {
        this.addVar(v, name)
      }
    }  
  }
}

export default InputBuilder;