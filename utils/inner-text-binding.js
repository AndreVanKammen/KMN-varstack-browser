// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { BaseBinding } from "../../KMN-varstack.js/vars/base.js";


class InnerTextBinding extends BaseBinding {
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

export default InnerTextBinding;