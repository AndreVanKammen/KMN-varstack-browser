import { ActionHandler, ActionVar } from "../../../KMN-varstack.js/vars/action.js";
import { ActionButtonControl, BaseValueComponent } from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

registerComponentShader('play-previous', /*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {
  actionColor = forgroundColor;
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);

  float playWidth = 0.8;
  float maxS = minSize(posSize) * 0.65 * (1.0-0.4*value.x);
  float dist = drw_Triangle( posSize.xy,
                             maxS*vec2( playWidth,1.0),
                             maxS*vec2(-playWidth,0.0),
                             maxS*vec2( playWidth,-1.0));
  dist = min( dist,
              drw_Line( posSize.xy,
                        maxS*vec2(-playWidth-0.15,-1.0),
                        maxS*vec2(-playWidth-0.15,1.0)));
  dist-= maxS * 0.15;
                   
  return defaultColor(dist);
}
`);

export class PlayPreviousElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {ActionVar} boolVar
   */
  constructor(boolVar, element) {
    super(boolVar, element, ActionButtonControl, 'play-previous');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}
class PlayPreviousDemo extends PlayPreviousElement {
  /**
   * @param {HTMLElement} element
   */
   constructor(element) {
     super(new ActionHandler(), element);
  }
}


RenderControl.geInstance().registerShader('play-previous', PlayPreviousDemo, ActionButtonControl);
