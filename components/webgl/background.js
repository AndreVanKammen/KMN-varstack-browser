import { ActionHandler, ActionVar } from "../../../KMN-varstack.js/vars/action.js";
import { ActionButtonControl, BaseValueComponent} from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

registerComponentShader('solid-background', /*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {
  return vec4(vec3(0.0),1.0);
}`);

export class SolidBackgroundElement extends BaseValueComponent {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   * @param {ActionVar} actionVar
   */
  constructor(actionVar, element) {
    super(element, new ActionButtonControl(element, actionVar), 'solid-background');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}
class SolidBackgroundDemo extends SolidBackgroundElement {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
   constructor(element) {
     super(new ActionHandler(), element);
  }
}

RenderControl.geInstance().registerShader('solid-background', SolidBackgroundDemo, ActionButtonControl);
