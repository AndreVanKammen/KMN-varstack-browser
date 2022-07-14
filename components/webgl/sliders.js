import { PointerTracker } from "../../../KMN-utils-browser/pointer-tracker.js";
import { BaseBinding } from "../../../KMN-varstack.js/vars/base.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentInfo, getElementHash, RenderControl, RectInfo } from "./render-control.js";

export class HorizontalSliderControl extends ValuePointerControl {
  constructor(element, valueVar) {
    super(element, valueVar);
    this._pointerTracker = new PointerTracker(this._element);
    this.lastWithinValue = this.value;
    this.size = 0.9
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

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
}
export class VerticalSliderControl extends ValuePointerControl {
  constructor(element, valueVar) {
    super(element, valueVar);
    this._pointerTracker = new PointerTracker(this._element);
    this.lastWithinValue = this.value;
    this.size = 0.9
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

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
        let newValue = pt.currentY / info.size.height - knobOffset;
        this.value = (this.lastWithinValue * x + newValue) / (x + 1);
      } else {
        this.lastWithinValue = pt.currentY / info.size.height - knobOffset;
        this.value = this.lastWithinValue;
      }
    }
    info.value[0] = this.value;
  }
}

export class HorizontalSliderElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element) {
    super(sliderVar, element, HorizontalSliderControl, 'slider');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 24
    }
  }
}

export class VerticalSliderElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element) {
    super(sliderVar, element, VerticalSliderControl, 'vertical-slider');
  }


  static get preferredSize() {
    return {
      width: 24,
      height: 128
    }
  }
}

export class VerticalLevelElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} levelVar
   */
  constructor(levelVar, element, shaderName) {
    super(levelVar, element, ValueControl, shaderName || 'verticalLevel');
  }

  static get preferredSize() {
    return {
      width: 24,
      height: 128
    }
  }
}

RenderControl.geInstance().registerShader('vertical-slider', VerticalSliderElement);
RenderControl.geInstance().registerShader('slider', HorizontalSliderElement);
