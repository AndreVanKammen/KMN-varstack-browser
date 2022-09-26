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
  actionColor = vec3(0.5+0.3*value.x+0.1*value.x*sin(float(drawCount)*0.05),0.0,0.0);
  actionHoverColor = vec3(0.8+0.2*value.x,0.0,0.0);

  float playWidth = 0.8;
  float maxS = minSize(posSize) * 0.8;
  float distRecord = drw_Circle( posSize.xy, maxS * 0.8);
  float distStop = drw_Rectangle(posSize.xy,vec2(0.0),vec2(maxS));
  float dist = mix(distRecord,distStop,value.x)-maxS * 0.15;

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
