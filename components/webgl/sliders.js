import { PointerTracker } from "../../../KMN-utils-browser/pointer-tracker.js";
import { BaseBinding } from "../../../KMN-varstack.js/vars/base.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { ComponentInfo, getElementHash, RectController } from "./rect-controller.js";
class Slider extends BaseBinding {
  _controller = RectController.geInstance();
  /** @type {FloatVar} */ 
  _sliderVar = undefined;
  min = 0;
  max = 1;
  step = 0.001;
  /** 
   * @param {FloatVar} sliderVar 
   */
  constructor(sliderVar) {
    super(sliderVar);

    if (sliderVar) {
      this.sliderVar = sliderVar;
    }
  }
  /**
   * @param {number} clipHash
   * @param {string} shaderName
   */
  initialize(clipHash, shaderName) {
    this._componentInfo = this._controller.getComponentInfo(clipHash, shaderName, this.updateComponentInfo.bind(this));
    this._sliderInfo = this._componentInfo.getFreeIndex(this.updateSliderInfo.bind(this))
  }

  /**
   * @param {ComponentInfo} info 
   */
  updateComponentInfo(info) {
    info.clipRect = { x: 0, y: 0, width: 16384, height: 16384 };
  }

  getSliderOffset() {
    if (this.min !== 0 || this.max !== 1) {
      return (this.sliderVar.$v - this.min) / (this.max - this.min);
    } else {
      return this.sliderVar.$v;
    }
  }

  /* THIS DOES NOT WORK!!!!! @type {import("./rect-controller.js").UpdateFunc} */
  /**@param {import("./rect-controller.js").RectInfo} info */
  updateSliderInfo(info) {
    info.value[0] = this.getSliderOffset();
  }

  setValue(x) {
    x = Math.max(0.0, Math.min(1.0, x));
    this.sliderVar.$v = this.min + Math.round(x * (this.max - this.min) / this.step) * this.step;
  }

  /** @type {FloatVar} */
  get sliderVar() {
    return this._sliderVar
  }
  set sliderVar(sliderVar) {
    this._sliderVar = sliderVar
    if (this._sliderVar.$varDefinition) {
      if (this._sliderVar.$varDefinition.range) {
        this.min = this._sliderVar.$varDefinition.range[0];
        this.max = this._sliderVar.$varDefinition.range[1];
      }
      if (this._sliderVar.$varDefinition.step) {
        this.step = this._sliderVar.$varDefinition.step;
      }
    }
    this.lastWithinValue = this.getSliderOffset();
  }

  remove() {
    if (this._sliderInfo) {
      this._componentInfo.freeRectInfo(this._sliderInfo);
      this._sliderInfo = undefined;
    }
    super.remove();
  }
}

export class HorizontalSliderElement extends Slider {
  /** @type {HTMLElement}*/
  _element;
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element) {
    super(sliderVar);
    this._element = element;
    this.clipElement = element.$getClippingParent()
    this.initialize(getElementHash(this.clipElement), 'slider');
    this._pointerTracker = new PointerTracker(this._element);
    this.size = 0.9
  }

  /**
   * @param {ComponentInfo} info 
   */
  updateComponentInfo(info) {
    let box = this.clipElement.getBoundingClientRect();
    info.clipRect.width  = this.clipElement.clientWidth;
    info.clipRect.height = this.clipElement.clientHeight;
    info.clipRect.x      = box.x;
    info.clipRect.y      = box.y;
  }

  /**@param {import("./rect-controller.js").RectInfo} info */
  updateSliderInfo(info) {
    super.updateSliderInfo(info);
    let box = this._element.getBoundingClientRect();
    let pt = this._pointerTracker.getLastPrimary();
    info.mouse.x = ~~pt.currentX;
    info.mouse.y = ~~pt.currentY;
    info.mouse.state = 
        (pt.isInside > 0 ? 1 : 0)
      + (pt.isDown   > 0 ? 2 : 0);

    info.rect.width  = box.width;
    info.rect.height = box.height;
    info.rect.x      = box.x;
    info.rect.y      = box.y;

    info.size.centerX = box.width / 2;
    info.size.centerY = box.height / 2;

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

    info.size.width   = box.width - box.height * this.size;
    info.size.height  = box.height * this.size;

    if (pt.isDown > 0) {
      let y = Math.abs(pt.currentY / box.height);
      if (y > 1.25) {
        info.mouse.state += 4;
        y -= 1.25;
        y *= y;
        let newValue = pt.currentX / box.width;
        this.setValue((this.lastWithinValue * y + newValue) / (y + 1));
      } else {
        this.lastWithinValue = pt.currentX / box.width;
        this.setValue(this.lastWithinValue);
      }
    }
  }

  remove() {
    this._pointerTracker.remove()
    super.remove();
  }
}
