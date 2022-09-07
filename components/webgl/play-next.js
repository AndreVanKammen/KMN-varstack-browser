import { ActionHandler, ActionVar } from "../../../KMN-varstack.js/vars/action.js";
import { ActionButtonControl, BaseValueComponent} from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { IRectangle, RenderControl} from "./render-control.js";

registerComponentShader('play-next', /*glsl*/`
// #include distance-drawing
// #include default-constants
vec4 renderComponent(vec2 center, vec2 size) {
  actionColor = forgroundColor;
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);

  float playWidth = 0.8;
  float maxS = minSize(posSize) * 0.65 * (1.0-0.4*value.x);
  float dist = drw_Triangle( posSize.xy,
                             maxS*vec2(-playWidth,-1.0),
                             maxS*vec2( playWidth,0.0),
                             maxS*vec2(-playWidth,1.0));
  dist = min( dist,
              drw_Line( posSize.xy,
                        maxS*vec2(playWidth+0.15,-1.0),
                        maxS*vec2(playWidth+0.15,1.0)));
  dist-= maxS * 0.15;
                   
  return defaultColor(dist);
}
`);

export class PlayNextElement extends BaseValueComponent {
  /**
   * @param {IRectangle} element
   * @param {ActionVar} boolVar
   */
  constructor(boolVar, element) {
    super(element, new ActionButtonControl(element, boolVar), 'play-next');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}

class PlayNextDemo extends PlayNextElement {
  /**
   * @param {IRectangle} element
   */
   constructor(element) {
     super(new ActionHandler(), element);
  }
}

RenderControl.geInstance().registerShader('play-next', PlayNextDemo, ActionButtonControl);
