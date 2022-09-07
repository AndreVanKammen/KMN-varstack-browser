import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, BooleanPointerControl, ToggleButtonControl, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentShaders, registerComponentShader } from "./component-shaders.js";
import { IRectangle, RenderControl} from "./render-control.js";

registerComponentShader('menu-open-close', /*glsl*/`
// #include distance-drawing
// #include default-constants

float hamburger(vec2 uv) {
  uv.y = abs(uv.y);
  float x = min(length(vec2(max(0.,abs(uv.x)-.5),uv.y)),
                length(vec2(max(0.,abs(uv.x)-.5),uv.y-.4* (1.0-value.x))));
  // x = min(x,    length(vec2(max(0.,abs(uv.x)-.25),uv.y+.25)));
  return x; // max(0.0,x-1.7);
}

float line(vec2 p, vec2 a, vec2 b)
{
	vec2 pa = p - a;
	vec2 ba = b - a;
	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float close(vec2 i) {
  i = abs(i);
  return line(i,vec2(0.0,0.0),vec2(0.4,0.4));
  //return abs(i.x-i.y)/sqrt(2.0)+.4;
}

vec4 renderComponent(vec2 center, vec2 size) {
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);
  float maxS = minSize(posSize);

	vec2 uv = posSize.xy / maxS;
    
  float dist = mix(hamburger(uv),
                   close(uv),
                   value.x) * maxS - 1.75;
      
  return defaultColor(dist);
}`);
export class MenuOpenCloseElement extends BaseValueComponent {
  /**
   * @param {IRectangle} element
   * @param {BoolVar} boolVar
   */
  constructor(boolVar, element) {
    super(element, new ToggleButtonControl(element, boolVar), 'menu-open-close');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}

class MenuOpenCloseDemo extends MenuOpenCloseElement {
  /**
   * @param {IRectangle} element
   */
   constructor(element) {
     super(new BoolVar(), element);
  }
}



RenderControl.geInstance().registerShader('menu-open-close', MenuOpenCloseDemo, ToggleButtonControl);
