import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentShaders } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

const knobShader = /*glsl*/`
// #include distance-drawing
const vec3 forgroundColor = vec3(0.8);
const vec3 forgroundHoverColor = vec3(1.0);
const vec3 actionColor = vec3(48.0/255.0,48.0/255.0,80.0/255.0);
const vec3 actionHoverColor = vec3(62.0/255.0,62.0/255.0,192.0/255.0);

vec4 renderComponent(vec2 center, vec2 size) {
  vec4 posSize = vec4((localCoord.xy-center) * -1.0,size * 0.5);

  // posSize.y += 0.15 * minSize(posSize);
  float maxS = minSize(posSize);
  float value = 1.0-value.x;
  float angle = -0.7 * pi + 1.4 * pi * value;
  mat2 rotate = mat2(
      cos(angle),-sin(angle),
      sin(angle), cos(angle));
  
  float dist = 100.0;
  float knobDist = drw_Circle(posSize, maxS * 0.6);
     
  dst_Combine(dist,
               drw_Rectangle(
      posSize.xy * rotate,
      maxS * vec2(0.0,  0.3),
      maxS * vec2(0.01, 0.3 )) - 0.05 * maxS-1.0);
    
  vec4 posSize2 = tf_CircleSegments( posSize,
                                     minSize(posSize) * 0.8,
                                     -pi * 0.7,
                                     pi * 0.7,
                                     11,1);
  maxS = minSize(posSize2);
  dst_Combine(dist,
               drw_Rectangle(posSize2.xy,vec2(0.0),maxS*vec2(0.15,0.15))-0.2*maxS);
  posSize.xy *= rotate;
   
  vec4 posSize3 = tf_CircleSegments( posSize,
                                     minSize(posSize) * 0.6,
                                     -pi,
                                     pi,
                                     10,1);
  dst_substract(knobDist,
    (drw_Rectangle(posSize3.xy,vec2(0.0),maxS*vec2(0.1,0.1))-0.4*maxS));

  vec3 fc = mouseInside?forgroundHoverColor:forgroundColor;
  return max(addColorAndOutline(
        knobDist,
        mouseInside?actionHoverColor:actionColor,
        fc,
        maxS * 0.04-0.5) , addColor(dist, fc));
}
`;
export class RotationKnobControl extends ValuePointerControl {
  constructor(element, valueVar) {
    super(element, valueVar);
    this.lastWithinValue = this.value;
    this.size = 0.9
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let pt = this._pointerTracker.getLastPrimary();

    if (pt.isDown > 0) {
      // if (iMouse.z>0.5) {
      //   // value = iMouse.x / iResolution.x;
      //   vec2 v = iMouse.xy - iResolution.xy * 0.5;
      //   float a = atan(v.x,v.y);
      //   value = clamp((a + pi * 0.7) /pi2 / 0.7,0.0,1.0);
      // }
      let x = info.mouse.x - info.size.centerX;
      let y = info.mouse.y - info.size.centerY;
      let a = Math.atan2(x, -y);
      console.log(x, y);
      let v = Math.min(Math.max((a + Math.PI * 0.7) / Math.PI / 2.0 / 0.7, 0.0), 1.0);
      this.value = this.value * 0.9 + 0.1 * v;
    }
    info.value[0] = this.value;
  }
}
export class KnobElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element) {
    super(sliderVar, element, RotationKnobControl, 'knob');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}

ComponentShaders['knob'] = knobShader;
RenderControl.geInstance().registerShader('knob', KnobElement);
