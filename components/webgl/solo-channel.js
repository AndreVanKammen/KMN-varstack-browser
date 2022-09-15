import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { BaseValueComponent, ToggleButtonControl } from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

const shaderName = 'solo-channel';
registerComponentShader(shaderName, /*glsl*/`
// #include distance-drawing
// #include default-constants

float SS(vec2 uv) {
  uv.y -= .1;
  if (uv.y <.275-uv.x*.5 && uv.x>0. || uv.y<-.275-uv.x*.5)
    uv = -uv;
  float a = abs(length(vec2(max(0.,abs(uv.x)),uv.y-.25))-.25);
  float b = length(vec2(uv.x-.236,uv.y-.332));
  float x = atan(uv.x-.05,uv.y-0.25)<1.14?a:b;
  return x;
}

vec4 renderComponent(vec2 center, vec2 size) {
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);

  float maxS = minSize(posSize) * 0.85;
  float dist = SS(posSize.xy / maxS + vec2(0.0,0.1))* maxS - maxS * 0.1;
  dist = min(dist,abs(length(posSize.xy) - maxS) - maxS * 0.15);

  actionColor = mix(vec3(0.2), actionColor,value.x);
  actionColor *= mouseInside ? 1.0 : 0.8;

  return addColor(dist, actionColor);
}
`);
export class SoloChannelElement extends BaseValueComponent {
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

class SoloChannelDemo extends SoloChannelElement {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
   constructor(element) {
     super(new BoolVar(), element);
  }
}



RenderControl.geInstance().registerShader(shaderName, SoloChannelDemo, ToggleButtonControl);
