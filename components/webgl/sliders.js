import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, ValuePointerControl } from "./component-base.js";
import { registerComponentShader } from "./component-shaders.js";
import { RenderControl } from "./render-control.js";

registerComponentShader('slider', /*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {
  // vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);
  vec4 posSize = vec4((localCoord.xy-center) * -1.0,size * 0.5);

  float playWidth = 0.8;
  float radius = minSize(posSize) * (mouseInside ? 1.0 : 0.7);
  float maxS = posSize.z - radius * 0.25;
  float distLine = drw_Line( posSize.xy,
                             vec2(-maxS,0.0),
                             vec2( maxS,0.0));
  float distCircle = drw_Circle(
      posSize.xy + vec2((value.x-0.5)*maxS*2.0,0.0),
      radius);

  dst_substract(distLine,distCircle-2.0);          
  vec3 fc = mouseInside?forgroundHoverColor:forgroundColor;
  //if (mouseFineTune) {
  //  dst_Combine(distLine,drw_Line(
  //  posSize.xy,
  //  vec2(0.0),
  //  mouse.xy));
  //}
  return max(defaultColor(distCircle+2.0),
              addColor( distLine - 1.0,
                        (mouseInside ? forgroundColor : forgroundColor * 0.7 )));
}`);

registerComponentShader('vertical-slider', /*glsl*/`
// #include distance-drawing
// #include default-constants

const float borderRadius = 4.0;

vec4 renderComponent(vec2 center, vec2 size) {
  actionColor = vec3(0.3);
  outLineThickness = 0.5;
  vec4 posSize = vec4((localCoord.xy-center) * -1.0, size * 0.5);

  float radius = posSize.z * 0.5;
  float maxS = posSize.w - radius;
  float distLine = drw_Line( posSize.xy,
                             vec2(0.0,-maxS),
                             vec2(0.0, maxS));
  float distCircle = drw_Rectangle(
      posSize.xy, vec2(0.0, (value.x-0.5)*maxS*2.0),
      vec2(posSize.z-2.0,radius)-borderRadius)-borderRadius;

  dst_substract(distLine,distCircle-2.0);          
  dst_substract(distCircle,abs(((value.x-0.5)*maxS*2.0)-posSize.y)+0.5);
  vec3 fc = mouseInside?forgroundHoverColor:forgroundColor;
  //if (mouseFineTune) {
  //  dst_Combine(distLine,drw_Line(
  //  posSize.xy,
  //  vec2(0.0),
  //  mouse.xy));
  //}
  return max(defaultColor(distCircle),
              addColor( distLine - 1.0,
        (mouseInside ? forgroundColor : forgroundColor * 0.7 )));
}`);

export class HorizontalSliderControl extends ValuePointerControl {
  /**
   * 
   * @param {import("../../TS/varstack-browser.js").IRectangle} element 
   * @param {FloatVar} valueVar 
   */
  constructor(element, valueVar) {
    super(element, valueVar);
    this.lastWithinValue = this.value;
    this.size = 0.9
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let knobOffset = info.size.width;
    info.size.width   = info.size.width - info.size.height * this.size;
    info.size.height  = info.size.height * this.size;
    knobOffset /= info.size.width;
    knobOffset = 0.5 * ( knobOffset - 1.0);

    let pt = this._pointerTracker;

    if (pt.isDown) {
      let y = Math.abs(pt.currentY / info.size.height);
      if (y > 1.25) {
        info.mouse.state += 4;
        y -= 1.25;
        y *= y;
        let newValue = pt.currentX / info.size.width - knobOffset;
        this.value = (this.lastWithinValue * y + newValue) / (y + 1);
      } else {
        this.lastWithinValue = pt.currentX / info.size.width - knobOffset;
        this.value = this.lastWithinValue;
      }
    }
    info.value[0] = this.value;
  }
}
export class VerticalSliderControl extends ValuePointerControl {
  /**
   * 
   * @param {import("../../TS/varstack-browser.js").IRectangle} element 
   * @param {FloatVar} valueVar 
   */
  constructor(element, valueVar) {
    super(element, valueVar);
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let knobOffset = info.size.width * 0.5;

    let pt = this._pointerTracker;
    if (pt.isDown) {
      this.value = 1.0 - ((pt.currentY - 0.5 * knobOffset) / (info.size.height - knobOffset));
    }
    info.value[0] = this.value;
  }
}

export class HorizontalSliderElement extends BaseValueComponent {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element) {
    super(element, new HorizontalSliderControl(element, sliderVar), 'slider');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 24
    }
  }
}

export class VerticalSliderElement extends BaseValueComponent {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element) {
    super(element, new VerticalSliderControl(element, sliderVar), 'vertical-slider');
  }

  static get preferredSize() {
    return {
      width: 24,
      height: 128
    }
  }
}
class VerticalSliderDemo extends VerticalSliderElement {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
   constructor(element) {
     super(new FloatVar(), element);
  }
}

class HorizontalSliderDemo extends HorizontalSliderElement {
  /**
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
   constructor(element) {
     super(new FloatVar(), element);
  }
}

RenderControl.geInstance().registerShader('vertical-slider', VerticalSliderDemo, VerticalSliderControl);
RenderControl.geInstance().registerShader('slider', HorizontalSliderDemo, HorizontalSliderControl);
