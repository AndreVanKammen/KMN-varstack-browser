import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, PassiveValueControl, ValueControl } from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { IRectangle, RenderControl } from "./render-control.js";

registerComponentShader("verticalLevel",/*glsl*/`
vec4 renderComponent(vec2 center, vec2 size) {
  float level = smoothstep(localCoord.y - 1.0, localCoord.y + 1.0,(1.0-value.x) * size.y);
  level = max(level,smoothstep(size.x* 0.3, size.x* 0.4,abs(localCoord.x-center.x)));
  level = 1.0 - level;
  return vec4(vec3(level), 0.3 * level);
}`);

export class VerticalLevelElement extends BaseValueComponent {
  /**
   * @param {IRectangle} element
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

RenderControl.geInstance().registerShader('verticalLevel', VerticalLevelElement, ValueControl);
