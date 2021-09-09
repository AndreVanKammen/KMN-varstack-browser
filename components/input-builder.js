// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { BaseBinding, BaseVar } from '../../KMN-varstack.js/vars/base.js';
import { RecordVar } from '../../KMN-varstack.js/structures/record.js';
import InputBinding from '../utils/input-binding.js';
import { addCSS } from '../utils/html-utils.js';

let labelUid = 0;
const nop = function () { };
const cssStr = /*css*/`/*css*/
table.input-table {
  overflow: auto;
}
td.isLabel {
  width: 33%;
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
   * @param {string} [overrideType]
   */
  addVar(v, labelName, overrideType) {
    labelName = labelName || v.$varDefinition.name;
    let labelId = 'i_' + (labelUid++);
    let row = this.body.$el({tag:'tr'});
    let label = row.$el({tag:'td', cls:'isLabel'}).$el({tag:'label'});
    let input = row.$el({tag:'td', cls:'isInput'}).$el({tag:'input'});
    label.onclick = (event) => this.options.onLabelClick(event, labelName, v);
    input.onclick = (event) => this.options.onInputClick(event, labelName, v);
    label.innerText = labelName;
    label.setAttribute('for',labelId);
    input.setAttribute('id',labelId);
    let dataBinding = new InputBinding(v, input, overrideType);
    return {
      labelId,
      row,
      label,
      input
    }
  }  

  /**
   * @param {RecordVar} rec
   * @param {string[]} [overrideTypes]
   */
  addRecord(rec, overrideTypes) { 
    for (var name of rec.$fieldNames) {
      let v = rec[name];
      if (v && v instanceof BaseVar) {
        this.addVar(v, name, overrideTypes ? overrideTypes[name] : undefined)
      }
    }  
  }
}

export default InputBuilder;