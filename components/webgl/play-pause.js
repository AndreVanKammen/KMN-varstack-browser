import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, BooleanPointerControl, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentShaders } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";

const playPauseShader = /*glsl*/`
// #include distance-drawing
const vec3 forgroundColor = vec3(0.0,0.0,0.6);
const vec3 forgroundHoverColor = vec3(0.0,0.0,1.0);
const vec3 actionColor = vec3(218.0/255.0,253.0/255.0,3.0/255.0);
const vec3 actionHoverColor = vec3(255.0/255.0,255.0/255.0,48.0/255.0);

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
                   
  vec3 fc = mouseInside?forgroundHoverColor:forgroundColor;
  return addColorAndOutline(
        dist,
        mouseInside?actionHoverColor:actionColor,
        fc,
        maxS * 0.05);
  // return addColorAndOutline(
  //           dist,
  //           vec3(0.25,0.25,0.8),
  //           vec3(1.0,1.0,1.0),
  //           maxS * 0.02);
}`;
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

ComponentShaders['play-pause'] = playPauseShader;
RenderControl.geInstance().registerShader('play-pause', PlayPauseElement);
