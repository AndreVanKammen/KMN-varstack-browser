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
  outLineThickness = 1.25;
  forgroundColor = vec3(0.2);
  forgroundHoverColor = vec3(0.5);
  //actionColor = vec3(5.0,5.0,192.0)/255.0;
  //actionHoverColor = vec3(0.3,0.3,1.0);

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
      if (mouseInside) {
        actionHoverColor = vec3(0.6);
        dist = abs(dist)-outLineThickness;
      } else {
        dist = maxS;
      }
    }
  }

  return addColorAndOutline(dist, currentActionColor, mouseInside?vec3(0.6):vec3(0.1), outLineThickness);
}`);

export class StarRatingElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} floatVar
   */
  constructor(floatVar, element) {
    let control = new HorizontalSliderControl(element, floatVar);
    super(element, control, 'star-rating');
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
     super(new FloatVar(), element);
  }
}



RenderControl.geInstance().registerShader('star-rating', StarRatingDemo, HorizontalSliderControl);
