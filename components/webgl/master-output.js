import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { BaseValueComponent, ToggleButtonControl } from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

const shaderName = 'master-output';
registerComponentShader(shaderName, /*glsl*/`
// #include distance-drawing
// #include default-constants

float MM(vec2 uv) {
  uv.y-=.1;
  float x = min(length(vec2(uv.x-.35,max(0.,abs(uv.y)-.5))),
                 line(uv,vec2(-.35,.5),vec2(.0,-.1)));
  x = min(x,line(uv,vec2(.0,-.1),vec2(.35,.5)));
  return min(x,length(vec2(uv.x+.35,max(0.,abs(uv.y)-.5))));
}

vec4 renderComponent(vec2 center, vec2 size) {
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);

  float maxS = minSize(posSize) * 0.85;
  float dist = MM(posSize.xy / maxS + vec2(0.0,0.1))* maxS - maxS * 0.1;
  dist = min(dist,abs(length(posSize.xy) - maxS) - maxS * 0.15);

  actionColor = mix(vec3(0.2), actionColor,value.x);
  actionColor *= mouseInside ? 1.0 : 0.8;

  return addColor(dist, actionColor);
}
`);
export class MasterOutputElement extends BaseValueComponent {
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

class MasterOutputDemo extends MasterOutputElement {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
   constructor(element) {
     super(new BoolVar(), element);
  }
}



RenderControl.geInstance().registerShader(shaderName, MasterOutputDemo, ToggleButtonControl);
