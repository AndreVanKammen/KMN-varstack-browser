// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { BaseBinding, BaseVar } from '../../KMN-varstack.js/vars/base.js';
import { RecordVar } from '../../KMN-varstack.js/structures/record.js';
import createLookupHandler from './lookup-handler.js';
import { FloatVar } from '../../KMN-varstack.js/vars/float.js';
import { HorizontalSliderElement } from '../components/webgl/sliders.js';
import { defaultTextBinding } from './inner-text-binding.js';

class ButtonInputElement extends BaseBinding{
  /** 
   * @param {BaseVar} baseVar
   * @param {HTMLButtonElement} element
  */
  constructor(baseVar, element) {
    super(baseVar);
    if (element) {
      this.setButton(element);
    }
  }

  handleButonClicked() {
    this.baseVar.$v = true;
  }

  handleButtonChanged() {
    this.element.$setTextNode(this.baseVar.$niceStr);
    this.element.disabled = this.baseVar.$v;
  }

  /** @param {HTMLButtonElement} element */
  setButton (element) {
    this.element = element;
    this.changeEvent = this.baseVar.$addEvent(this.handleButtonChanged.bind(this),true);
    element.addEventListener('click', this.handleButonClicked.bind(this));
    // @ts-ignore: 
    element.dataVar = this.baseVar;
  }
}
class InputBinding extends BaseBinding {
  /** 
   * @param {BaseVar} baseVar
   * @param {HTMLInputElement} element
  */
  constructor (baseVar, element) {
    super(baseVar);
    //console.log('InputBinding: ',baseVar, element, type);
    this.type = '';
    if (element) {
      this.setInput(element);
    }
  }

  handleVarChangedChecked (baseVar) {
     this.element.checked = this.baseVar.$v;
  }

  handleInputChangedChecked (ev) {
    this.baseVar.$v = this.element.checked;
  }

  handleVarChanged (baseVar) {
    this.element.value = this.baseVar.$v;
  }

  handleInputChanged (ev) {
    this.baseVar.$v = this.element.value;
  }

  handleVarChangedDate(baseVar) {
    this.element.valueAsDate = this.baseVar.$v;
  }

  handleInputChangedDate (ev) {
    this.baseVar.$v = this.element.valueAsDate;
  }

  /** @param {HTMLInputElement} element */
  setInput (element) {
    this.element = element;
    element.value = this.baseVar.$v;
    let typeArr = this.baseVar.$varDefinition.inputType.split(':');
    if ((this.type || typeArr[0]) !== 'textarea') {
      element.type = this.type || typeArr[0];
    }
    if (this.baseVar.$varDefinition.isReadOnly) {
      element.setAttribute('readOnly', ''); 
    }
    // console.log('Input', element, this.baseVar);

    if (element.type === 'checkbox') {
      this.changeEvent = this.baseVar.$addEvent(this.handleVarChangedChecked.bind(this));
      element.addEventListener('change', this.handleInputChangedChecked.bind(this));
      this.handleVarChangedChecked();
    } else if (element.type === 'date') {
      this.changeEvent = this.baseVar.$addEvent(this.handleVarChangedDate.bind(this));
      element.addEventListener('change', this.handleInputChangedDate.bind(this));
      this.handleVarChangedChecked();
    } else if (element.type === 'range') {
      this.changeEvent = this.baseVar.$addEvent(this.handleVarChanged.bind(this));
      element.addEventListener('input', this.handleInputChanged.bind(this));
      if (this.baseVar.$varDefinition.range) {
        element.min = this.baseVar.$varDefinition.range[0].toString();
        element.max = this.baseVar.$varDefinition.range[1].toString();
      } else {
        element.min = '0';
        element.max = '1';
      }
      if (this.baseVar.$varDefinition.directInput) {
        element.addEventListener('keyup', this.handleInputChanged.bind(this));
      }
      if (this.baseVar.$varDefinition.step) {
        element.step = this.baseVar.$varDefinition.step.toString();
      } else {
        element.step = '0.001';
      }
      this.handleVarChanged()
    } else {
      this.changeEvent = this.baseVar.$addEvent(this.handleVarChanged.bind(this));
      element.addEventListener('change', this.handleInputChanged.bind(this));
      if (this.baseVar.$varDefinition.directInput) {
        element.addEventListener('keyup', this.handleInputChanged.bind(this));
      }
    }
    createLookupHandler(this.baseVar,element);

    // @ts-ignore: 
    element.dataVar = this.baseVar;
  }

  dispose() {
    super.dispose();
    this.element.remove();
  }
}

class EnumDropDownBinding extends BaseBinding {
  /** 
   * @param {BaseVar} baseVar
   * @param {import('../TS/varstack-browser.js').IRectangle} element
  */
   constructor (baseVar, element) {
    super(baseVar);
    this.type = '';
    this.parentElement = element;
    this.createDropDown();
  }

  createDropDown() {
    this.element = this.parentElement.$el({ tag: 'select', cls: 'enum-' + this.baseVar.$varDefinition.name });
    // @ts-ignore
    let enumValues = this.baseVar.constructor.enumValues;
    for (let key of Object.keys(enumValues)) {
      let opt = this.element.$el({ tag: 'option' });
      opt.$setTextNode(key);
    }

    this.element.onchange = this.handleValueChanged.bind(this);
    this.changeEvent = this.baseVar.$addEvent(this.handleVarChanged.bind(this));
    this.handleVarChanged()
  }

  handleValueChanged (ev) {
    this.baseVar.$v = this.element.value;
  }

  handleVarChanged (baseVar) {
    this.element.value = this.baseVar.$niceStr;
  }

  dispose() {
    super.dispose();
    this.element.remove();
  }
}

export class CreateInputBinding extends BaseBinding {
  /** 
   * @param {BaseVar} baseVar
   * @param {import('../TS/varstack-browser.js').IRectangle} element
  */
  constructor (baseVar, element) {
    super(baseVar)
    let parentElement = element;
    if (this.baseVar.$varDefinition.isReadOnly) {
      this.binding = new defaultTextBinding(baseVar, element);
    } else {
      if (baseVar.$varDefinition.inputType === 'dropdown') {
        this.binding = new EnumDropDownBinding(baseVar, parentElement);
      } else if (baseVar.$varDefinition.inputType === 'range') {
        // @ts-ignore
        this.binding = new HorizontalSliderElement(baseVar, parentElement);
      } else if (baseVar.$varDefinition.inputType === 'button') {
        let buttonElement = parentElement.$el( { tag: 'button', cls: 'inline-input' });
        this.binding = new ButtonInputElement(baseVar, buttonElement);
      } else {
        /** @type {HTMLInputElement} */
        let inputElement;
        if (element instanceof HTMLInputElement) {
          inputElement = element;
        } else {
          if (baseVar.$varDefinition.inputType === 'textarea') {
            // @ts-ignore F*** HTML
            inputElement = parentElement.$el({ tag: 'textarea', cls: 'inline-input' });
          } else {
            inputElement = parentElement.$el({ tag: 'input', cls: 'inline-input' });
          }
        }
        // TODO HACKY: If this is a record variable then show the value field
        if (baseVar instanceof RecordVar) {
          if (baseVar.$valueFieldName) {
            this.binding = new InputBinding(baseVar[baseVar.$valueFieldName], inputElement);
          } else {
            this.binding = new InputBinding(baseVar, inputElement);
          }
        } else {
          this.binding = new InputBinding(baseVar, inputElement);
        }
      }
    }
    this.parentElement = parentElement;
  }

  dispose() {
    this.binding.dispose();
  }
}

export { InputBinding as default}