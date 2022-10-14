import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { BaseValueComponent, ToggleButtonControl } from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

const shaderName = 'auto-toggle';
registerComponentShader(shaderName, /*glsl*/`
// #include distance-drawing
// #include default-constants
float line(vec2 p, vec2 a, vec2 b)
{
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float AA(vec2 uv) {
  float x = length(vec2(
        abs(length(vec2(uv.x,
                         max(0.0,uv.y-.35) ))-0.35)
        ,min(0.,uv.y+.4)));
  return min(x,length(vec2(max(0.,abs(uv.x)-.25),uv.y-.1) ));
}

vec4 renderComponent(vec2 center, vec2 size) {
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);

  float maxS = minSize(posSize) * 0.85;
  float dist = AA(posSize.xy / maxS + vec2(0.0,0.1)) * maxS - maxS * 0.15;
  dist = min(dist,abs(length(posSize.xy) - maxS) - maxS * 0.15);

  actionColor = mix(vec3(0.1), actionColor,value.x);
  actionColor *= mouseInside ? 1.0 : 0.8;

  return addColor(dist, actionColor);
}
`);
export class AutoToggleElement extends BaseValueComponent {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   * @param {BoolVar} boolVar
   */
  constructor(boolVar, element) {
    super(element, new ToggleButtonControl(element, boolVar), shaderName);
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}

class AutoToggleDemo extends AutoToggleElement {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
   constructor(element) {
     super(new BoolVar(), element);
  }
}



RenderControl.geInstance().registerShader(shaderName, AutoToggleDemo, ToggleButtonControl);
