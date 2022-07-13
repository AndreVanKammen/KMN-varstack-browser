import { PointerTracker } from "../../../KMN-utils-browser/pointer-tracker.js";
import { BaseBinding } from "../../../KMN-varstack.js/vars/base.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { ComponentShaders } from "./component-shaders.js";
import { ComponentInfo, getElementHash, RenderControl, RectInfo } from "./render-control.js";

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
}
export class ValuePointerControl extends ValueControl {
  constructor(element, valueVar) {
    super(element, valueVar);
    this._pointerTracker = new PointerTracker(this._element);
    this.lastWithinValue = this.value;
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateSliderInfo(info) {
    RenderControl.setBoxDataFromElement(info, this._element);

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
}

export class HorizontalSliderControl extends ValuePointerControl {
  constructor(element, valueVar) {
    super(element, valueVar);
    this._pointerTracker = new PointerTracker(this._element);
    this.lastWithinValue = this.value;
    this.size = 0.9
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateSliderInfo(info) {
    super.updateSliderInfo(info);

    let knobOffset = info.size.width;
    info.size.width   = info.size.width - info.size.height * this.size;
    info.size.height  = info.size.height * this.size;
    knobOffset /= info.size.width;
    knobOffset = 0.5 * ( knobOffset - 1.0);

    let pt = this._pointerTracker.getLastPrimary();

    if (pt.isDown > 0) {
      let y = Math.abs(pt.currentY / info.size.height);
      if (y > 1.25) {
        info.mouse.state += 4;
        y -= 1.25;
        y *= y;
        let newValue = pt.currentX / info.size.width - knobOffset;
        this.value = (this.lastWithinValue * y + newValue) / (y + 1);
      } else {
        this.lastWithinValue = pt.currentX / info.size.width - knobOffset;
        this.value = this.lastWithinValue;
      }
    }
    info.value[0] = this.value;
  }

  dispose() {
    this._pointerTracker.remove()
  }
}
export class VerticalSliderControl extends ValuePointerControl {
  constructor(element, valueVar) {
    super(element, valueVar);
    this._pointerTracker = new PointerTracker(this._element);
    this.lastWithinValue = this.value;
    this.size = 0.9
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateSliderInfo(info) {
    super.updateSliderInfo(info);

    let knobOffset = info.size.height;
    info.size.width   = info.size.width * this.size;
    info.size.height  = info.size.height - info.size.width * this.size;
    knobOffset /= info.size.height;
    knobOffset = 0.5 * ( knobOffset - 1.0);

    let pt = this._pointerTracker.getLastPrimary();

    if (pt.isDown > 0) {
      let x = Math.abs(pt.currentX / info.size.width);
      if (x > 1.25) {
        info.mouse.state += 4;
        x -= 1.25;
        x *= x;
        let newValue = pt.currentY / info.size.width - knobOffset;
        this.value = (this.lastWithinValue * x + newValue) / (x + 1);
      } else {
        this.lastWithinValue = pt.currentY / info.size.height - knobOffset;
        this.value = this.lastWithinValue;
      }
    }
    info.value[0] = this.value;
  }

  dispose() {
    this._pointerTracker.remove()
  }
}

class BaseComponent {
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element, ControlClass, ShaderClass) {
    // TODO make Refactor ShaderClass from ComponentInfo in RenderControl for now its a string
    this._render = RenderControl.geInstance();

    this._control = new ControlClass(element, sliderVar);

    this._clipElement = element.$getClippingParent();
    this._componentInfo = this._render.getComponentInfo(getElementHash(this._clipElement), ShaderClass, this.updateComponentInfo.bind(this));
    this._sliderInfo = this._componentInfo.getFreeIndex(this.updateSliderInfo.bind(this))
  }

  /**
   * @param {ComponentInfo} info 
   */
  updateComponentInfo(info) {
    RenderControl.setClipBoxFromElement(info, this._clipElement);
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateSliderInfo(info) {
    this._control.updateSliderInfo(info);
  }

  dispose() {
    this._control.dispose()
    if (this._sliderInfo) {
      this._componentInfo.freeRectInfo(this._sliderInfo);
      this._sliderInfo = undefined;
    }
  }
}
export class HorizontalSliderElement extends BaseComponent {
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element) {
    super(sliderVar, element, HorizontalSliderControl, 'slider');
  }
}

export class VerticalSliderElement extends BaseComponent {
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element) {
    super(sliderVar, element, VerticalSliderControl, 'vertical-slider');
  }
}


// TODO Extract component base from this
export class VerticalLevelElement extends BaseBinding {
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element, shaderName) {
    super(sliderVar);
    /** @type {HTMLElement}*/
    this._element = element;
    this._controller = RenderControl.geInstance();
    this.clipElement = element.$getClippingParent();
    this._componentInfo = this._controller.getComponentInfo(getElementHash(this.clipElement), shaderName || 'verticalLevel', this.updateComponentInfo.bind(this));
    this._componentInfoHandle = this._componentInfo.getFreeIndex(this.updateComponentInstance.bind(this))
    this.size = 0.9
  }

  /**
   * @param {ComponentInfo} info 
   */
  updateComponentInfo(info) {
    RenderControl.setClipBoxFromElement(info, this.clipElement);
  }

  /**@param {RectInfo} info */
  updateComponentInstance(info) {
    RenderControl.setBoxDataFromElement(info, this._element);
    info.value[0] = this.baseVar.$v;
  }

  dispose() {
    if (this._componentInfoHandle) {
      this._componentInfo.freeRectInfo(this._componentInfoHandle);
      this._componentInfoHandle = undefined;
    }
    // this._pointerTracker.remove()
    super.dispose();
  }
}

RenderControl.geInstance().registerShader('vertical-slider', VerticalSliderElement);
RenderControl.geInstance().registerShader('slider', HorizontalSliderElement);
