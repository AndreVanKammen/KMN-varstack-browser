import { PointerTracker } from "../../../KMN-utils-browser/pointer-tracker.js";
import { BaseVar } from "../../../KMN-varstack.js/vars/base.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { ComponentInfo, getElementHash, RenderControl } from "./render-control.js";

/**
 * Maps a value for a control using min/max step and scale(to be made, linear/exponential)
 */
export class ValueControl {
  constructor(element, valueVar) {
    this._element = element;
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
  
  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    RenderControl.setBoxDataFromElement(info, this._element);
    info.value[0] = this.value;
  }
   
  dispose() {
  }
}
export class ValuePointerControl extends ValueControl {
  constructor(element, valueVar) {
    super(element, valueVar);
    this._pointerTracker = new PointerTracker(this._element);
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let pt = this._pointerTracker.getLastPrimary();
    info.mouse.x = ~~pt.currentX;
    info.mouse.y = ~~pt.currentY;
    info.mouse.state =
      (pt.isInside > 0 ? 1 : 0)
      + (pt.isDown > 0 ? 2 : 0);

    if (pt.isDown) {
      info.rect.width += 1000;
      info.rect.height += 1000;
      info.rect.x -= 500;
      info.rect.y -= 500;
      info.size.centerX += 500;
      info.size.centerY += 500;
      info.mouse.x += 500;
      info.mouse.y += 500;
    }
  }

  dispose() {
    this._pointerTracker.dispose();
  }
}

export class BooleanControl {
  constructor(element, valueVar) {
    this._element = element;
    this._valueVar = valueVar;
    this.easeFactor = 0.1;
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
    this.easeFactor = 0.1;
    this.valueSmooth *= 1.0 - this.easeFactor;
    // TODO correct easefactor for framerate
    this.valueSmooth += this.value ? this.easeFactor : 0.0;
    info.value[0] = this.valueSmooth;
  }
   
  dispose() {
  }
}
export class BooleanPointerControl extends BooleanControl {
  constructor(element, valueVar) {
    super(element, valueVar);
    this._pointerTracker = new PointerTracker(this._element);
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let pt = this._pointerTracker.getLastPrimary();
    info.mouse.x = ~~pt.currentX;
    info.mouse.y = ~~pt.currentY;
    info.mouse.state =
      (pt.isInside > 0 ? 1 : 0)
      + (pt.isDown > 0 ? 2 : 0);
  }

  dispose() {
    this._pointerTracker.dispose();
  }
}


/**
 * @template {ValueControl} T0
 */
export class BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {BaseVar} valueVar
   * @param {new (HTMLElement,BaseVar) => T0} ControlClass - A generic parameter that flows through to the return type
   */
  constructor(valueVar, element, ControlClass, ShaderClass) {
    // TODO make Refactor ShaderClass from ComponentInfo in RenderControl for now its a string
    this._render = RenderControl.geInstance();

    this._control = new ControlClass(element, valueVar);

    this._clipElement = element.$getClippingParent();
    this._componentInfo = this._render.getComponentInfo(
      getElementHash(this._clipElement),
      ShaderClass,
      this.updateComponentInfo.bind(this));
    this._componentInfoHandle = this._componentInfo.getFreeIndex(this.updateRenderInfo.bind(this))
  }

  static get preferredSize() {
    return {
      width: 48,
      height: 48
    }
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
  }
}
