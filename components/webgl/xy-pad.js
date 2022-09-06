import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, Value2PointerControl, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentShaders, registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

registerComponentShader('xy-pad',/*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {
  outLineThickness = 1.0;
  vec4 posSize = vec4((localCoord.xy-center), size);
  posSize.y *= -1.0;
  vec2 a = abs(posSize.xy);
  float dist = min(a.x,a.y);
  dist = min(dist, drw_Circle(posSize.xy - (value.xy - .5) * posSize.zw, 5.0));
  return defaultColor(dist);
}`);

class XYPadControl extends Value2PointerControl {
  constructor(element, xVar, yVar) {
    super(element, xVar, yVar);
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let pt = this._pointerTracker.getLastPrimary();

    if (pt.isDown > 0) {
      this.value = pt.currentX / info.size.width;
      this.value2 = (info.size.height - pt.currentY) / info.size.height;
    }
    info.value[0] = this.value;
    info.value[1] = this.value2;
  }
}
export class XYPadElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} xVar
   * @param {FloatVar} yVar
   */
  constructor(xVar, yVar, element) {
    super(element, new XYPadControl(element, xVar, yVar), 'xy-pad');
  }

  static get preferredSize() {
    return {
      width: 256,
      height: 256
    }
  }
}

class XYPadDemo extends XYPadElement {
  /**
   * @param {HTMLElement} element
   */
   constructor(element) {
     super(new FloatVar(), new FloatVar(), element);
  }
}


RenderControl.geInstance().registerShader('xy-pad', XYPadDemo, XYPadControl);
