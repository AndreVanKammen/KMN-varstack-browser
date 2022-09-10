import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, PassiveValueControl, ValueControl } from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { RenderControl } from "./render-control.js";

registerComponentShader("verticalLevel",/*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {

  vec4 posSize = vec4((localCoord.xy-center), size);
  float dist = max(
      posSize.y * -1.0 - (value.x-0.5) * posSize.w ,
      abs(posSize.x)-posSize.z * 0.4);
  return defaultColor(dist);
}`);

export class VerticalLevelElement extends BaseValueComponent {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   * @param {FloatVar} levelVar
   */
  constructor(levelVar, element, shaderName) {
    super(element, new PassiveValueControl(element, levelVar), shaderName || 'verticalLevel');
  }

  static get preferredSize() {
    return {
      width: 24,
      height: 128
    }
  }
}

class VerticalLevelDemo extends VerticalLevelElement {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
   constructor(element) {
     super(new FloatVar(), element);
  }
}


RenderControl.geInstance().registerShader('verticalLevel', VerticalLevelDemo, PassiveValueControl);
