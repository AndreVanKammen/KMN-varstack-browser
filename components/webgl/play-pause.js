import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, BooleanPointerControl, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentShaders, registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

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
  float dist = mix(distPlay,distPause,value.x)-maxS * 0.3;
                   
  return defaultColor(dist);
}`);
export class ToggleButtonControl extends BooleanPointerControl {
  constructor(element, valueVar) {
    super(element, valueVar);
    this.lastWithinValue = this.value;
    this.mouseDownInside = false;
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let pt = this._pointerTracker.getLastPrimary();

    if (pt.isDown > 0) {
      this.mouseDownInside = true;
    } else {
      let x = info.mouse.x - info.size.centerX;
      let y = info.mouse.y - info.size.centerY;
      if (this.mouseDownInside && pt.isInside) {
        this.value = !this.value;
      }
      this.mouseDownInside = false;
    }
  }
}
export class PlayPauseElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {BoolVar} boolVar
   */
  constructor(boolVar, element) {
    super(boolVar, element, ToggleButtonControl, 'play-pause');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}

RenderControl.geInstance().registerShader('play-pause', PlayPauseElement, ToggleButtonControl);
