// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { BaseBinding, BaseVar } from "../../KMN-varstack.js/vars/base.js";


export class InnerTextBinding extends BaseBinding {
  /** 
   * @param {BaseVar} baseVar
   * @param {import("../../../TS/varstack-browser.js").IRectangle} element
  */
   constructor (baseVar, element) {
    super(baseVar);
    if (element) {
      this.setElement(element);
    }
  }

  handleVarChanged (baseVar) {
    this.element.innerText = this.baseVar.$niceStr;
  }

  setElement (element) {
    this.element = element;
    this.element.innerText = this.baseVar.$niceStr;
    this.changeEvent = this.baseVar.$addDeferedEvent(this.handleVarChanged.bind(this));
  }
}

export let defaultTextBinding = InnerTextBinding;

/**
 * 
 * @param {{new(baseVar, element)}} binding 
 */
export function setDefualtTextBinding(binding) {
  defaultTextBinding = binding;
}