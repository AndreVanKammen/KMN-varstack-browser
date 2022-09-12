import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent} from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";
import { HorizontalSliderControl } from "./sliders.js";

const shaderName = 'progress-bar';
registerComponentShader(shaderName, /*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {

  vec4 posSize = vec4((localCoord.xy-center), size);
  float dist = max(
      posSize.x + (value.x-0.5) * -posSize.z ,
      abs(posSize.y)-posSize.w * 0.4);
  dist = max(dist,6.0-abs(mod(posSize.x-posSize.y-float(drawCount),80.0)));
  return vec4(defaultColor(dist).rgb,0.7);
}
`);

export class ProgressBarElement extends BaseValueComponent {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   * @param {FloatVar} floatVar
   */
  constructor(floatVar, element) {
    let control = new HorizontalSliderControl(element, floatVar);
    super(element, control, shaderName);
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 26
    }
  }
}

class ProgressBarDemo extends ProgressBarElement {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
   constructor(element) {
     super(new FloatVar(), element);
  }
}

RenderControl.geInstance().registerShader(shaderName, ProgressBarDemo, HorizontalSliderControl);
