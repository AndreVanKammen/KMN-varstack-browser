import { ActionVar } from "../../../KMN-varstack.js/vars/action.js";
import { ActionButtonControl, BaseValueComponent} from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

registerComponentShader('play-reverse', /*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);

  float playWidth = 0.8;
  float maxS = minSize(posSize) * 0.5;
  if (posSize.x>0.0) {
    posSize.x -= maxS*(1.0+playWidth);
  }
  posSize.x += maxS * playWidth * 1.2;
  float dist = drw_Triangle( posSize.xy,
                             maxS*vec2(playWidth,1.0),
                             maxS*vec2(-playWidth,0.0),
                             maxS*vec2(playWidth,-1.0));
  dist-= maxS * 0.15;
                   
  return defaultColor(dist);
}`);

export class PlayReverseElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {ActionVar} boolVar
   */
  constructor(boolVar, element) {
    super(boolVar, element, ActionButtonControl, 'play-reverse');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}

RenderControl.geInstance().registerShader('play-reverse', PlayReverseElement, ActionButtonControl);
