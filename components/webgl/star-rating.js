import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, BooleanPointerControl, ToggleButtonControl, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentShaders, registerComponentShader } from "./component-shaders.js";
import { RenderControl} from "./render-control.js";
import { HorizontalSliderControl } from "./sliders.js";

registerComponentShader('star-rating', /*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {
  outLineThickness = 1.0;
  vec4 posSize = vec4((localCoord.xy-center) ,size);
  float maxS = min(posSize.w,posSize.z/5.0)*0.5;
  posSize.y -= maxS*0.04;
  float starLevel = (posSize.x + 5.0 * maxS)/maxS/10.0;
  posSize.x = mod(posSize.x+maxS,maxS*2.0)-maxS;

  vec4 posSize3 = tf_CircleSegments( posSize,
                                     maxS*0.9,
                                     -pi,
                                     pi,
                                     6,0);
  float dist = posSize3.y + abs(posSize3.x*pi*0.7);
  if (starLevel<0.0 || starLevel>1.0) {
    dist = maxS;
  } else {
    if (starLevel>value.x) {
      dist = abs(dist)-outLineThickness;
    }
  }

  return defaultColor(dist);
}`);

export class StarRatingElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {BoolVar} boolVar
   */
  constructor(boolVar, element) {
    super(boolVar, element, ToggleButtonControl, 'star-rating');
    this._control.easeFactor = 0.02;
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}

class StarRatingDemo extends StarRatingElement {
  /**
   * @param {HTMLElement} element
   */
   constructor(element) {
     super(new BoolVar(), element);
  }
}



RenderControl.geInstance().registerShader('star-rating', StarRatingDemo, HorizontalSliderControl);
