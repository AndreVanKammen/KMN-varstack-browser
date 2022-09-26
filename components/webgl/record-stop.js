import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { BaseValueComponent, ToggleButtonControl } from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

const shaderName = 'record-stop';
registerComponentShader(shaderName, /*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);
  actionColor = vec3(0.7,0.0,0.0);
  actionHoverColor = vec3(1.0,0.0,0.0);

  float playWidth = 0.8;
  float maxS = minSize(posSize) * 0.65;
  float distPlay = drw_Circle( posSize.xy, 0.8);
  float distPause = drw_Rectangle(posSize.xy,vec2(0.0),vec2(maxS));
  float dist = mix(distPlay,distPause,value.x)-maxS * 0.15;

  return defaultColor(dist);
}`);
export class RecordStopElement extends BaseValueComponent {
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

class RecordStopDemo extends RecordStopElement {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
   constructor(element) {
     super(new BoolVar(), element);
  }
}

RenderControl.geInstance().registerShader(shaderName, RecordStopDemo, ToggleButtonControl);
