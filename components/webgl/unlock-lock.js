import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, BooleanPointerControl, ToggleButtonControl, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentShaders, registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

registerComponentShader('unlock-lock', /*glsl*/`
// #include distance-drawing
// #include default-constants

float lock(vec2 uv) {
  float up = smoothstep(0.0,0.5,1.0-value.x);
  float rot = smoothstep(0.6,1.0,1.0-value.x);
  uv.y += .2 + up * 0.125;
  uv.x += rot * 0.25;
  float x = length(vec2(max(vec2(0.,0.),abs(uv)-vec2(0.375,0.3))))-0.02;
  uv.x -= rot * 0.5;

  float inv = rot * 2.0 - 1.0;
  float radius = abs(.25 * inv);
  //  uv.x /= rot * 2.0 - 1.0;
  uv.y -= .5 + up * 0.2;
  float y = abs(length(vec2(max(uv.y-.25+radius,0.0),uv.x))-radius);
  y = length(vec2(y,max((uv.x*inv>0.0 ? -.25 : -.5)-uv.y,.0)));
  
  return min(x-0.02,y-0.05); // max(0.0,x-1.7);
}

vec4 renderComponent(vec2 center, vec2 size) {
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0), size * 0.5);
  float maxS = minSize(posSize);

  vec2 uv = posSize.xy / maxS;
    
  float dist = lock(uv*0.75) * maxS - 0.2;
      
  return addColor(dist,currentActionColor * (0.5+0.5*smoothstep(0.0,0.3,value.x)));
}
`);
export class UnlockLockElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {BoolVar} boolVar
   */
  constructor(boolVar, element) {
    super(boolVar, element, ToggleButtonControl, 'unlock-lock');
    this._control.easeFactor = 0.02;
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}

class UnlockLockDemo extends UnlockLockElement {
  /**
   * @param {HTMLElement} element
   */
   constructor(element) {
     super(new BoolVar(), element);
  }
}



RenderControl.geInstance().registerShader('unlock-lock', UnlockLockDemo, ToggleButtonControl);
