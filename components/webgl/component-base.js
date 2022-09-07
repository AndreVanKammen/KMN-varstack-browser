import { RecordVar } from "../../../KMN-varstack.js/structures/record.js";
import { ActionVar } from "../../../KMN-varstack.js/vars/action.js";
import { BaseVar } from "../../../KMN-varstack.js/vars/base.js";
import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { PointerInfo } from "./pointer-info.js";
import { ComponentInfo, getElementHash, IRectangle, RectInfo, RenderControl } from "./render-control.js";

export class PassiveControl {
  /**
   * 
   * @param {IRectangle} element 
   */
  constructor(element) {
    this._element = element;
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    RenderControl.setBoxDataFromElement(info, this._element);
  }
  dispose() {
  }
}

/**
 * Maps a value for a control using min/max step and scale(to be made, linear/exponential)
 */
export class ValueControl  {
  constructor(valueVar) {
    this._valueVar = valueVar;
  }

  get min() {
    if (this._valueVar.$varDefinition) {
      if (this._valueVar.$varDefinition.range) {
        return this._valueVar.$varDefinition.range[0];
      }
    }
    return 0.0;
  }

  get max() {
    if (this._valueVar.$varDefinition) {
      if (this._valueVar.$varDefinition.range) {
        return this._valueVar.$varDefinition.range[1];
      }
    }
    return 1.0;
  }

  get step() {
    if (this._valueVar.$varDefinition) {
      if (this._valueVar.$varDefinition.step) {
        return this._valueVar.$varDefinition.step;
      }
    }
    return 0.0000001;
  }

  set value(x) {
    x = Math.max(0.0, Math.min(1.0, x));
    this._valueVar.$v = this.min + Math.round(x * (this.max - this.min) / this.step) * this.step;
  }

  get value() {
    if (this.min !== 0 || this.max !== 1) {
      return (this._valueVar.$v - this.min) / (this.max - this.min);
    } else {
      return this._valueVar.$v;
    }
  }
}
export class PassiveValueControl extends PassiveControl {
  /**
   * 
   * @param {IRectangle} element 
   * @param {BaseVar} valueVar 
   */
  constructor(element, valueVar) {
    super(element);
    this._valueControl = new ValueControl(valueVar);
  }
  get value() {
    return this._valueControl.value;
  }
  set value(x) {
    this._valueControl.value = x;
  }
}

// class PointerTracker {
//   /**
//    * 
//    * @param {IRectangle} element 
//    */
//   constructor(element) {
//   }
//   getLastPrimary() {
//     return {};
//   }
//   dispose() {
//   }
// }

export class ValuePointerControl extends PassiveValueControl {
  /**
   * 
   * @param {IRectangle} element 
   * @param {BaseVar} valueVar 
   */
   constructor(element, valueVar) {
    super(element, valueVar);
     this._pointerTracker = new PointerInfo(this._element);
     this.overScanOnMouseDown = false;
  }

  /**@param {RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    this._pointerTracker.update();

    let pt = this._pointerTracker;
    info.mouse.x = ~~pt.currentX;
    info.mouse.y = ~~pt.currentY;
    info.mouse.state =
      (pt.isInside ? 1 : 0)
      + (pt.isDown ? 2 : 0);

    if (pt.isDown && this.overScanOnMouseDown) {
      info.rect.width += 1000;
      info.rect.height += 1000;
      info.rect.x -= 500;
      info.rect.y -= 500;
      info.size.centerX += 500;
      info.size.centerY += 500;
      info.mouse.x += 500;
      info.mouse.y += 500;
    }

    info.value[0] = this.value;
  }

  dispose() {
    super.dispose();
    this._pointerTracker.dispose();
  }
}
export class Value2PointerControl extends ValuePointerControl {
  /**
   * 
   * @param {IRectangle} element 
   * @param {BaseVar} valueVar 
   * @param {BaseVar} valueVar2
   */
   constructor(element, valueVar, valueVar2) {
    super(element, valueVar)
    this._value2Control = new ValueControl(valueVar2);
  }
  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);
    info.value[0] = this.value;
  }
  get value2() {
    return this._value2Control.value;
  }
  set value2(x) {
    this._value2Control.value = x;
  }
}

export class BooleanControl {
  constructor(element, valueVar) {
    this._element = element;
    this._valueVar = valueVar;
    this.easeFactor = 0.03;
    this.valueSmooth = this.value ? 1.0 : 0.0;
  }

  set value(x) {
    this._valueVar.$v = x;
  }

  get value() {
    return this._valueVar.$v;
  }
  
  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    RenderControl.setBoxDataFromElement(info, this._element);
    // this.valueSmooth *= 1.0 - this.easeFactor;
    // TODO correct easefactor for framerate
    this.valueSmooth += this.value ? this.easeFactor : -this.easeFactor;
    this.valueSmooth = Math.min(Math.max(this.valueSmooth, 0.0), 1.0);
    info.value[0] = this.valueSmooth;
  }
   
  dispose() {
  }
}
export class BooleanPointerControl extends BooleanControl {
  /**
   * 
   * @param {IRectangle} element 
   * @param {BaseVar} valueVar 
   */
  constructor(element, valueVar) {
    super(element, valueVar);
    this._pointerTracker = new PointerInfo(this._element);
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);
    this._pointerTracker.update();

    let pt = this._pointerTracker;
    info.mouse.x = ~~pt.currentX;
    info.mouse.y = ~~pt.currentY;
    info.mouse.state =
      (pt.isInside ? 1 : 0)
      + (pt.isDown ? 2 : 0);
  }

  dispose() {
    this._pointerTracker.dispose();
  }
}

export class BaseDemoComponent {
  static get preferredSize() {
    return {
      width: 48,
      height: 48
    }
  }
  /** @type {RecordVar} */
  get demoData() {
    return null;
  }
  dispose() {
  }
}
export class BaseValueComponent extends BaseDemoComponent {
  /**
   * @param {IRectangle} element
   * @param {PassiveControl} controlClass
   * @param {string} shaderName
   */
  constructor(element, controlClass, shaderName) {
    super();

    // TODO make Refactor ShaderClass from ComponentInfo in RenderControl for now its a string
    this._render = RenderControl.geInstance();

    this._control = controlClass;  // new ControlClass(element, valueVar);

    this._clipElement = element.$getClippingParent();
    this._componentInfo = this._render.getComponentInfo(
      getElementHash(this._clipElement),
      shaderName,
      this.updateComponentInfo.bind(this));
    this._componentInfoHandle = this._componentInfo.getFreeIndex(this.updateRenderInfo.bind(this))
  }

  get demoData() {
    // @ts-ignore
    if (this._control._valueVar) {
      // @ts-ignore
      return this._control._valueVar
    }
    if (this._control instanceof Value2PointerControl) {
      return {
        x: this._control._valueControl._valueVar,
        y: this._control._value2Control._valueVar
      }
    }
    if (this._control instanceof ValuePointerControl) {
      return this._control._valueControl._valueVar;
    }
    return null;
  }


  /**
   * @param {ComponentInfo} info 
   */
  updateComponentInfo(info) {
    RenderControl.setClipBoxFromElement(info, this._clipElement);
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    this._control.updateRenderInfo(info);
  }

  dispose() {
    this._control.dispose()
    if (this._componentInfoHandle) {
      this._componentInfo.freeRectInfo(this._componentInfoHandle);
      this._componentInfoHandle = undefined;
    }
    super.dispose();
  }
}

export class ToggleButtonControl extends BooleanPointerControl {
  /**
   * 
   * @param {IRectangle} element 
   * @param {BoolVar} valueVar 
   */
  constructor(element, valueVar) {
    super(element, valueVar);
    this.lastWithinValue = this.value;
    this.mouseDownInside = false;
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let pt = this._pointerTracker;

    if (pt.isDown) {
      this.mouseDownInside = true;
    } else {
      // let x = info.mouse.x - info.size.centerX;
      // let y = info.mouse.y - info.size.centerY;
      if (this.mouseDownInside && pt.isInside) {
        this.value = !this.value;
      }
      this.mouseDownInside = false;
    }
  }
}

export class ActionButtonControl extends BooleanPointerControl {
  /**
   * @param {IRectangle} element
   * @param {ActionVar} valueVar
   */
   constructor(element, valueVar) {
    super(element, valueVar);
    this.mouseDownInside = false;
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let pt = this._pointerTracker;

    if (pt.isDown) {
      this.mouseDownInside = true;
    } else {
      // let x = info.mouse.x - info.size.centerX;
      // let y = info.mouse.y - info.size.centerY;
      if (this.mouseDownInside && pt.isInside) {
        this.value = true;
      }
      this.mouseDownInside = false;
    }
  }
}
