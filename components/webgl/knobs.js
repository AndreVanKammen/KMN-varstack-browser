import { BaseVar } from "../../../KMN-varstack.js/vars/base.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, ValuePointerControl } from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

registerComponentShader('turn-knob',/*glsl*/`

// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {
  actionColor = vec3(0.9);
  vec4 posSize = vec4((localCoord.xy-center) * -1.0,size * 0.5);

  // posSize.y += 0.15 * minSize(posSize);
  float maxS = minSize(posSize);
  float value = 1.0-value.x;
  float angle = -0.7 * pi + 1.4 * pi * value;
  mat2 rotate = mat2(
      cos(angle),-sin(angle),
      sin(angle), cos(angle));
  float knob_radius = 0.625 - (mouseDown?0.075:0.0);
  float dist = 100.0;
  float knobDist = drw_Circle(posSize.xy, maxS * knob_radius);

  dst_Combine(dist,
               drw_Rectangle(
      posSize.xy * rotate,
      maxS * vec2(0.0,  0.325),
      maxS * vec2(0.01, 0.325 )) - 0.05 * maxS-1.0);

  vec4 posSize2 = tf_CircleSegments( posSize,
                                     minSize(posSize) * 0.8,
                                     -pi * 0.7,
                                     pi * 0.7,
                                     11,1);
  maxS = minSize(posSize2);
  dst_Combine(dist,
               drw_Rectangle(
      posSize2.xy,
      vec2(0.0),
      maxS * vec2(0.15,0.15)) - 0.2 * maxS);
  posSize.xy *= rotate;

  vec4 posSize3 = tf_CircleSegments( posSize,
                                     minSize(posSize) * knob_radius,
                                     -pi,
                                     pi,
                                     10,1);
  dst_substract(knobDist,
    (drw_Rectangle(posSize3.xy,vec2(0.0),maxS*vec2(0.1,0.1))-0.4*maxS));

  vec3 fc = vec3(1.0);// mouseInside?forgroundHoverColor:forgroundColor;
  return max(addColorAndOutline(
        knobDist,
        mouseInside?actionHoverColor * 0.8:actionColor * 0.6,
        fc,
        maxS * 0.04-0.5) , addColor(dist, fc));
}
`);
export class RotationKnobControl extends ValuePointerControl {
  /**
   *
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   * @param {BaseVar} valueVar
   */
  constructor(element, valueVar) {
    super(element, valueVar);
    this.size = 0.9
    this.valueSmooth = valueVar.$v;
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let pt = this._pointerTracker;

    if (pt.isDown) {
      let x = info.mouse.x - info.size.centerX;
      let y = info.mouse.y - info.size.centerY;
      let a = Math.atan2(x, -y);
      this.value = Math.min(Math.max((a + Math.PI * 0.7) / Math.PI / 2.0 / 0.7, 0.0), 1.0);
    }
    this.valueSmooth = this.valueSmooth * 0.9 + 0.1 * this.value;
    info.value[0] = this.valueSmooth;
  }
}
export class DeltaUpDownControl extends ValuePointerControl {
  /**
   *
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   * @param {BaseVar} valueVar
   */
  constructor(element, valueVar) {
    super(element, valueVar);
    this.lastDeltaY = -1;
    this.lastVal = this.value;
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let pt = this._pointerTracker;

    if (pt.isDown) {
      if (this.lastDeltaY === -1) {
        this.lastDeltaY = info.mouse.y;
        this.lastVal = this.value;
      }
      let dy = this.lastDeltaY - info.mouse.y;
      this.value = this.lastVal + dy / 200.0;
    } else {
      this.lastDeltaY = -1;
      this.lastVal = this.value;
    }
    info.value[0] = this.value;
  }
}
export class KnobElement extends BaseValueComponent {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element) {
    super(element, new DeltaUpDownControl(element, sliderVar), 'turn-knob');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}

class KnobDemo extends KnobElement {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
   constructor(element) {
     super(new FloatVar(), element);
  }
}


RenderControl.geInstance().registerShader('turn-knob', KnobDemo, DeltaUpDownControl);
