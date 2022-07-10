import { PointerTracker } from "../../../KMN-utils-browser/pointer-tracker.js";
import { BaseBinding } from "../../../KMN-varstack.js/vars/base.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { ComponentInfo, getElementHash, RectController, RectInfo } from "./rect-controller.js";

export class HorizontalSliderElement extends BaseBinding {
  /** @type {HTMLElement}*/
  _element;
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element) {
    super(sliderVar);

    if (sliderVar) {
      this._sliderVar = sliderVar;
      this.lastWithinValue = this.getSliderOffset();
    }
    this._element = element;
    this._controller = RectController.geInstance();
    this.clipElement = element.$getClippingParent();
    this._componentInfo = this._controller.getComponentInfo(getElementHash(this.clipElement), 'slider', this.updateComponentInfo.bind(this));
    this._sliderInfo = this._componentInfo.getFreeIndex(this.updateSliderInfo.bind(this))
    this._pointerTracker = new PointerTracker(this._element);
    this.size = 0.9
  }

  get min() {
    if (this._sliderVar.$varDefinition) {
      if (this._sliderVar.$varDefinition.range) {
        return this._sliderVar.$varDefinition.range[0];
      }
    }
    return 0.0;
  }

  get max() {
    if (this._sliderVar.$varDefinition) {
      if (this._sliderVar.$varDefinition.range) {
        return this._sliderVar.$varDefinition.range[1];
      }
    }
    return 1.0;
  }

  get step() {
    if (this._sliderVar.$varDefinition) {
      if (this._sliderVar.$varDefinition.step) {
        return this._sliderVar.$varDefinition.step;
      }
    }
    return 0.0000001;
  }

  setValue(x) {
    x = Math.max(0.0, Math.min(1.0, x));
    this._sliderVar.$v = this.min + Math.round(x * (this.max - this.min) / this.step) * this.step;
  }

  getSliderOffset() {
    if (this.min !== 0 || this.max !== 1) {
      return (this._sliderVar.$v - this.min) / (this.max - this.min);
    } else {
      return this._sliderVar.$v;
    }
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
    info.value[0] = this.getSliderOffset();
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

  dispose() {
    this._pointerTracker.remove()
    if (this._sliderInfo) {
      this._componentInfo.freeRectInfo(this._sliderInfo);
      this._sliderInfo = undefined;
    }
    super.dispose();
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
    this._controller = RectController.geInstance();
    this.clipElement = element.$getClippingParent();
    this._componentInfo = this._controller.getComponentInfo(getElementHash(this.clipElement), shaderName || 'verticalLevel', this.updateComponentInfo.bind(this));
    this._componentInfoHandle = this._componentInfo.getFreeIndex(this.updateComponentInstance.bind(this))
    this.size = 0.9
  }

  /**
   * @param {ComponentInfo} info 
   */
  updateComponentInfo(info) {
    RectController.setClipBoxFromElement(info, this.clipElement);
  }

  /**@param {RectInfo} info */
  updateComponentInstance(info) {
    RectController.setBoxDataFromElement(info, this._element);
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
