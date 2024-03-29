import { ActionHandler, ActionVar } from "../../../KMN-varstack.js/vars/action.js";
import { ActionButtonControl, BaseValueComponent} from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

registerComponentShader('play-forward', /*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {
  actionColor = forgroundColor;
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);

  float playWidth = 0.8;
  float maxS = minSize(posSize) * 0.5 * (1.0-0.4*value.x);
  if (posSize.x>0.0) {
    posSize.x -= maxS*(1.0+playWidth);
  }
  posSize.x += maxS * playWidth * 1.05;
  float dist = drw_Triangle( posSize.xy,
                             maxS*vec2(-playWidth,-1.0),
                             maxS*vec2( playWidth,0.0),
                             maxS*vec2(-playWidth,1.0));
  dist-= maxS * 0.15;
                   
  return defaultColor(dist);
}
`);

export class PlayForwardElement extends BaseValueComponent {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   * @param {ActionVar} boolVar
   */
  constructor(boolVar, element) {
    super(element, new ActionButtonControl(element, boolVar), 'play-forward');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}

class PlayForwardDemo extends PlayForwardElement {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
   constructor(element) {
     super(new ActionHandler(), element);
  }
}

RenderControl.geInstance().registerShader('play-forward', PlayForwardDemo, ActionButtonControl);
