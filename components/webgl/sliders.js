import { PointerTracker } from "../../../KMN-utils-browser/pointer-tracker.js";
import { BaseBinding } from "../../../KMN-varstack.js/vars/base.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentShaders, registerComponentShader } from "./component-shaders.js";
import { ComponentInfo, getElementHash, RenderControl, RectInfo } from "./render-control.js";

registerComponentShader('slider', /*glsl*/`
// #include distance-drawing
// #include default-constants

vec4 renderComponent(vec2 center, vec2 size) {
  // vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);
  vec4 posSize = vec4((localCoord.xy-center) * -1.0,size * 0.5);

  float playWidth = 0.8;
  float radius = minSize(posSize);
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
  return max(addColorAndOutline( distCircle+2.0,
                                 mouseInside?actionHoverColor:actionColor,
                                 fc,
                                 0.25) , 
              addColor( distLine - 1.0,
                        forgroundColor));
}`);

registerComponentShader('vertical-slider', /*glsl*/`
float line(vec2 p, vec2 a, vec2 b)
{
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

vec4 renderComponent(vec2 center, vec2 size) {
  vec2 posCenter = center + vec2(0.0,(1.0-value.x*2.0) * size.y * 0.5);
  float maxS = min(size.x,size.y);
  float lineThickness = maxS * 0.1;
  float r = size.x * 0.5;
  float d = length(localCoord - posCenter);
  float b = 1.0-smoothstep(r-lineThickness,r,d);
  float a = 1.0-smoothstep(r-lineThickness,r,d);
  float g;
  float l = 1.0-smoothstep(0.0,3.0,length(vec2(
          localCoord.x-center.x,
          max(0.0,abs(localCoord.y-center.y)-size.y*0.5))))-b;
  if (mouseFineTune) {
    a = max(0.15-0.15*smoothstep(0.0,500.0,length(localCoord - center)),a);
    float m = a * 6.0;
    l = max(l,m-m*smoothstep(0.0,2.0,line(localCoord, posCenter, mouse.xy)));
  }
  if (mouseInside) {
    float fade = 1.0+0.5*sin(float(drawCount)*0.1);
    g = (1.0-smoothstep(0.0,lineThickness * fade,abs(d-r+fade+lineThickness)))*0.9;
    l *= 1.1;
  } else {
    g = (1.0-smoothstep(0.0,lineThickness,abs(d-r+lineThickness)))*0.8;
  }
  a = max(l,a);
  g = max(l,g)*0.8;
  return  vec4(g, g, max(b-g,l)*0.8, a); // vec4(vec3(value.x),1.0);
}`);

export class HorizontalSliderControl extends ValuePointerControl {
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

    let pt = this._pointerTracker.getLastPrimary();

    if (pt.isDown > 0) {
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
  constructor(element, valueVar) {
    super(element, valueVar);
    this.lastWithinValue = this.value;
    this.size = 0.9
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    super.updateRenderInfo(info);

    let knobOffset = info.size.height;
    info.size.width   = info.size.width * this.size;
    info.size.height  = info.size.height - info.size.width * this.size;
    knobOffset /= info.size.height;
    knobOffset = 0.5 * ( knobOffset - 1.0);

    let pt = this._pointerTracker.getLastPrimary();

    if (pt.isDown > 0) {
      let x = Math.abs(pt.currentX / info.size.width);
      if (x > 1.25) {
        info.mouse.state += 4;
        x -= 1.25;
        x *= x;
        let newValue = 1.0 - (pt.currentY / info.size.height - knobOffset);
        this.value = (this.lastWithinValue * x + newValue) / (x + 1);
      } else {
        this.lastWithinValue = 1.0 - (pt.currentY / info.size.height - knobOffset);
        this.value = this.lastWithinValue;
      }
    }
    info.value[0] = this.value;
  }
}

export class HorizontalSliderElement extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element) {
    super(sliderVar, element, HorizontalSliderControl, 'slider');
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
   * @param {HTMLElement} element
   * @param {FloatVar} sliderVar
   */
  constructor(sliderVar, element) {
    super(sliderVar, element, VerticalSliderControl, 'vertical-slider');
  }

  static get preferredSize() {
    return {
      width: 24,
      height: 128
    }
  }
}

RenderControl.geInstance().registerShader('vertical-slider', VerticalSliderElement);
RenderControl.geInstance().registerShader('slider', HorizontalSliderElement);
