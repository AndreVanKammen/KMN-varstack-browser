import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, BooleanPointerControl, ToggleButtonControl, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentShaders, registerComponentShader } from "./component-shaders.js";
import { IRectangle, RenderControl} from "./render-control.js";

registerComponentShader('play-pause', /*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);

  float playWidth = 0.8;
  float maxS = minSize(posSize) * 0.65;
  float distPlay = drw_Triangle( posSize.xy,
          maxS*vec2(-playWidth,-1.0),
          maxS*vec2( playWidth,0.0),
          maxS*vec2(-playWidth,1.0));
          
  float distPause = min(
      drw_Rectangle(posSize.xy,maxS*vec2(-0.5,0.0),maxS*vec2(0.1,1.0)),
      drw_Rectangle(posSize.xy,maxS*vec2(0.5,0.0),maxS*vec2(0.1,value.x)));
  float dist = mix(distPlay,distPause,value.x)-maxS * 0.15;
                   
  return defaultColor(dist);
}`);
export class PlayPauseElement extends BaseValueComponent {
  /**
   * @param {IRectangle} element
   * @param {BoolVar} boolVar
   */
  constructor(boolVar, element) {
    super(element, new ToggleButtonControl(element, boolVar), 'play-pause');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}

class PlayPauseDemo extends PlayPauseElement {
  /**
   * @param {IRectangle} element
   */
   constructor(element) {
     super(new BoolVar(), element);
  }
}



RenderControl.geInstance().registerShader('play-pause', PlayPauseDemo, ToggleButtonControl);
