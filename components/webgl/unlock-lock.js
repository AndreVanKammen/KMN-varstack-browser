import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, BooleanPointerControl, ToggleButtonControl, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentShaders, registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

registerComponentShader('unlock-lock', /*glsl*/`
// #include distance-drawing
// #include default-constants

float lock(vec2 uv) {
  float up = smoothstep(0.0,0.4,1.0-value.x);
  float rot = smoothstep(0.6,1.0,1.0-value.x);
  uv.y += .2 + up * 0.1;
  uv.x += rot * 0.25;
  float x = length(vec2(max(vec2(0.,0.),abs(uv)-.3)));
  uv.x -= rot * 0.5;

  uv.x /= rot * 2.0 - 1.0;
  uv.y -= .5+ up * 0.1;
  float y = abs(length(vec2(max(uv.y,0.0),uv.x))-.25);
  y = length(vec2(y,max((uv.x>0.0 ? -.2 : -.5)-uv.y,.0)));
  
  return min(x,y); // max(0.0,x-1.7);
}

vec4 renderComponent(vec2 center, vec2 size) {
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);
  float maxS = minSize(posSize);

  vec2 uv = posSize.xy / maxS;
    
  float dist = lock(uv*0.8) * maxS - .5;
      
  return defaultColor(dist) * (0.5+0.5*value.x);
}
`);
export class UnlockLockElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {BoolVar} boolVar
   */
  constructor(boolVar, element) {
    super(boolVar, element, ToggleButtonControl, 'unlock-lock');
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
