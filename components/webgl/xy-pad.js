import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, Value2PointerControl, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentShaders, registerComponentShader } from "./component-shaders.js";
import { IRectangle, RenderControl} from "./render-control.js";

registerComponentShader('xy-pad',/*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {
  forgroundColor = vec3(0.4);
  forgroundHoverColor = vec3(0.7);
  actionColor = vec3(0.7,0.70,0.0);
  actionHoverColor = vec3(1.0,1.0,0.0);

  outLineThickness = 1.0;

  vec4 posSize = vec4((localCoord.xy-center), size);
  posSize.y *= -1.0;
  vec2 a = abs(posSize.xy);
  float dist = min(a.x,a.y);
  dist = min(dist, drw_Circle(posSize.xy - (value.xy - .5) * posSize.zw, mouseInside ? 10.0 : 5.0));
  return defaultColor(dist);
}`);

class XYPadControl extends Value2PointerControl {
  /**
   * 
   * @param {IRectangle} element 
   * @param {FloatVar} xVar 
   * @param {FloatVar} yVar 
   */
  constructor(element, xVar, yVar) {
    super(element, xVar, yVar);
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let pt = this._pointerTracker;

    if (pt.isDown) {
      this.value = pt.currentX / info.size.width;
      this.value2 = (info.size.height - pt.currentY) / info.size.height;
    }
    info.value[0] = this.value;
    info.value[1] = this.value2;
  }

  /**
   * @param {FloatVar} xVar 
   * @param {FloatVar} yVar 
   */
  assignVars(xVar, yVar) {
    this._valueControl = new ValueControl(xVar);
    this._value2Control = new ValueControl(yVar);
  }
}
export class XYPadElement extends BaseValueComponent {
  /**
   * @param {IRectangle} element
   * @param {FloatVar} xVar
   * @param {FloatVar} yVar
   */
  constructor(xVar, yVar, element) {
    let control = new XYPadControl(element, xVar, yVar)
    super(element, control, 'xy-pad');
    this._control = control; // This is already set but helps typscript
  }

  static get preferredSize() {
    return {
      width: 256,
      height: 256
    }
  }
  /**
   * @param {FloatVar} xVar 
   * @param {FloatVar} yVar 
   */
  assignVars(xVar, yVar) {
    this._control.assignVars(xVar, yVar);
  }
}

class XYPadDemo extends XYPadElement {
  /**
   * @param {IRectangle} element
   */
   constructor(element) {
     super(new FloatVar(), new FloatVar(), element);
  }
}


RenderControl.geInstance().registerShader('xy-pad', XYPadDemo, XYPadControl);
