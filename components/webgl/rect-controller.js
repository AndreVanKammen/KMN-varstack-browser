import { animationFrame } from "../../../KMN-utils-browser/animation-frame.js";
import getWebGLContext, { RenderingContextWithUtils } from "../../../KMN-utils.js/webglutils.js";
import { ComponentShaders } from "./component-shaders.js";


const baseVertexShader = /*glsl*/`
uniform sampler2D dataTexture;
uniform vec2 canvasResolution;
uniform float dpr;
uniform int startIX;
out vec2 localCoord;

flat out vec4 posAndSize;
flat out vec4 mouse;
flat out vec4 value;

void main(void) {
  int dataIx = (startIX + (gl_VertexID / 6)) * 4;

  // We use vertex pulling to get the data that is the same for 4 points
  vec4 box = texelFetch(dataTexture, ivec2(dataIx % 1024, dataIx / 1024), 0);
  dataIx++;
  posAndSize = texelFetch(dataTexture, ivec2(dataIx % 1024, dataIx / 1024), 0);
  dataIx++;
  mouse = texelFetch(dataTexture, ivec2(dataIx % 1024, dataIx / 1024), 0);
  dataIx++;
  value = texelFetch(dataTexture, ivec2(dataIx % 1024, dataIx / 1024), 0);

  int pointIx = gl_VertexID % 6;

  // This is the only value messing up the bits for 2 triangles making a square so we change that
  if (pointIx==4) {
    pointIx = 2;
  }

  // Calculate X and Y from the index number we get
  vec4 boxPoint = vec4(((pointIx & 1) == 1) ? vec2(1.0,box.x + box.z) : vec2(0.0, box.x),
                       ((pointIx & 2) == 0) ? vec2(1.0,box.y + box.w) : vec2(0.0, box.y));
  localCoord = boxPoint.xz * box.zw;
  gl_Position = vec4((boxPoint.yw * dpr / canvasResolution) * vec2(2.0,-2.0) + vec2(-1.0,1.0), 1.0, 1.0);
}`;

export const baseComponentShaderHeader = /*glsl*/`
precision highp float;

uniform int drawCount;

in vec2 localCoord;
flat in vec4 posAndSize;
flat in vec4 mouse;
flat in vec4 value;

#define mouseInsideOrDown (mouse.z>0.0)
#define mouseInside ((int(mouse.z) & 0x01) != 0)
#define mouseDown ((int(mouse.z) & 0x02) != 0)
#define mouseFineTune ((int(mouse.z) & 0x04) != 0)
`;

export const baseComponentShaderFooter = `

out vec4 fragColor;
void main(void) {
  fragColor = renderComponent(posAndSize.xy, posAndSize.zw);
}`;


/** @typedef {(info:RectInfo) => {}} UpdateFunc */
/** @typedef {(info:ComponentInfo)=>void} ComponentUpdateFunc */
/** @typedef {(gl: RenderingContextWithUtils, shaderProgram: import("../../../KMN-utils.js/webglutils.js").WebGLProgramExt)=>void} ShaderInitFunc */

export class RectInfo {
  /** @type {UpdateFunc} */ onUpdate;
  index = 0;
  rect  = {x:0, y:0, width:0, height:0};
  size  = {centerX:0, centerY:0, width:0, height:0};
  mouse = {x:0, y:0, state:0, enterTime:0};
  value = [0,0,0,0];
}

function getComponentKey(clipHash, shaderName) {
  return clipHash + '_' + shaderName;
}

export class ComponentInfo {
  constructor() {
    /** @type {ComponentUpdateFunc} */
    this.onUpdate;
    /** @type {ShaderInitFunc} */
    this.onShaderInit;
    /** @type {RectInfo[]} */
    this._rectInfos = []
    /** @type {import("../../../KMN-utils.js/webglutils.js").WebGLProgramExt} */
    this._shaderProgram = undefined;
    this.getShader = this.handleGetShader.bind(this);
    this.shaderName = '';
    // shaderHeader = baseComponentShaderHeader;
    // shaderFooter = baseComponentShaderFooter;
    this.clipHash = 0;
    this.clipRect = { x: 0, y: 0, width: 0, height: 0 };
  }

  handleGetShader() {
    return baseComponentShaderHeader + ComponentShaders[this.shaderName] + baseComponentShaderFooter;
  }

  get isVisible() {
    return this.clipRect.width!==0 && this.clipRect.height!==0;
  }
  getKey() {
    return getComponentKey(this.clipHash, this.shaderName);
  }
  /**
   * @param {UpdateFunc} onUpdate 
   * @returns {RectInfo} 
   */
  getFreeIndex(onUpdate) {
    const rectInfo = new RectInfo();
    rectInfo.index = this._rectInfos.push(rectInfo) - 1;
    rectInfo.onUpdate = onUpdate;
    return rectInfo;
  }

  /** @param {RectInfo} info */
  freeRectInfo(info) {
    this._rectInfos.splice(info.index,1);
  }

  /**
   * @param {RenderingContextWithUtils} gl 
   */
  getShaderProgram(gl) {
    if (this._shaderProgram === undefined) {
      this._shaderProgram = gl.getShaderProgram(
        baseVertexShader,
        this.getShader(),
        // this.shaderHeader +
        //   ComponentShaders[this.shaderName] +
        // this.shaderFooter,
        2
      );
      console.log('Shader compiled: ', this.shaderName);
    }
    return this._shaderProgram;
  }
}

/** @type {RectController} */ 
let rectController = null;
const floatSizePerComponent = 16;
export class RectController {

  constructor() {
    // TODO seperate shaderInfo from componentInfo by registering ShaderInfo for shaderName
    /** @type {Record<string,ComponentInfo>} */
    this._componentInfos = {};
    this._arrayLength = 256;
    this._webglArray = new Float32Array(this._arrayLength * floatSizePerComponent);
    this.textureInfo = { texture: undefined, size: 0 }
  }

  /**
   * @param {number} clipHash 
   * @param {string} shaderName 
   * @param {ComponentUpdateFunc} onUpdate 
   */
  getComponentInfo(clipHash, shaderName, onUpdate) {
    const key = getComponentKey(clipHash, shaderName)
    let componentInfo = this._componentInfos[key];
    if (!componentInfo) {
      componentInfo = new ComponentInfo();
      componentInfo.clipHash = clipHash;
      componentInfo.shaderName = shaderName;
      componentInfo.onUpdate = onUpdate;
      this._componentInfos[key] = componentInfo;
    }
    return componentInfo;
  }

  /**
   * Give a full screen overlayCanvas in which all the controls are rendered
   * @param {HTMLCanvasElement} canvas 
   */
  setCanvas(canvas) {
    this.canvas = canvas;
    this.gl = getWebGLContext(this.canvas, { alpha: true });
    const ext = this.gl.getExtension('EXT_color_buffer_float');

    this.drawCount = 0;
    animationFrame(this.handleFrame)
  }


  handleFrame = () => {
    let gl = this.gl;
    let {w, h, dpr} = gl.updateCanvasSize(this.canvas);

    let componentLength = 0;
    for (const component of Object.values(this._componentInfos)) {
      component.onUpdate(component);
      if (component.isVisible) {
        componentLength += component._rectInfos.length;
      }
    }

    if (componentLength >= this._arrayLength) {
      this._arrayLength = this._arrayLength * 2;
      const newArray = new Float32Array(this._arrayLength * floatSizePerComponent);
      newArray.set(this._webglArray);
      this._webglArray = newArray;
    }

    const renderData = [];
    {
      let pos = 0;
      const wa = this._webglArray
      for (let foreground = 0; foreground <= 1; foreground++) {
        for (const component of Object.values(this._componentInfos)) {
          if (component.isVisible) {
            const startIx = pos / floatSizePerComponent;
            for (let ix = 0; ix < component._rectInfos.length; ix++) {
              const si = component._rectInfos[ix];
              if (si) { // && si.size.width && si.size.height) {
                si.onUpdate(si);
                if ((si.mouse.state > 0) === (foreground === 1)) {
                  // if (component.shaderName === 'music-keyboard') {
                  //   if (this.drawCount % 30 === 29) {
                  //     console.log('>', startIx, length);
                  //   }
                  // }
                    // Draw area rectangle
                  wa[pos++] = si.rect.x;
                  wa[pos++] = si.rect.y;
                  wa[pos++] = si.rect.width;
                  wa[pos++] = si.rect.height;
  
                  // Control size center, width,height
                  wa[pos++] = si.size.centerX;
                  wa[pos++] = si.size.centerY;
                  wa[pos++] = si.size.width;
                  wa[pos++] = si.size.height;
              
                  wa[pos++] = si.mouse.x;
                  wa[pos++] = si.mouse.y;
                  wa[pos++] = si.mouse.state;
                  wa[pos++] = si.mouse.enterTime;
  
                  wa[pos++] = si.value[0];
                  wa[pos++] = si.value[1];
                  wa[pos++] = si.value[2];
                  wa[pos++] = si.value[3];
                }
              }
            }
            let componentLength = (pos / floatSizePerComponent) - startIx;
            if (componentLength > 0) {
              renderData.push({
                startIx,
                component,
                componentLength
              });
            }
          }
        }
      }
    }
    gl.viewport(0, 0, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(this.gl.BLEND);
    gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.SCISSOR_TEST);

    this.drawCount++;
    for (const rd of renderData) {
      const length = rd.componentLength;
      const clipRect = rd.component.clipRect;
      const shaderProgram = rd.component.getShaderProgram(gl);
      gl.useProgram(shaderProgram);
      // if (rd.component.shaderName === 'music-keyboard') {
      //   if (this.drawCount % 30 === 0) {
      //     console.log('.', rd.startIx * 6, length * 6);
      //   }
      // }

      shaderProgram.u.canvasResolution?.set(w, h);
      shaderProgram.u.drawCount?.set(this.drawCount)
      if (shaderProgram.u.dataTexture) {
        gl.activeTexture(gl.TEXTURE3);
        this.textureInfo = gl.createOrUpdateFloat32TextureBuffer(this._webglArray, this.textureInfo);
        gl.bindTexture(gl.TEXTURE_2D, this.textureInfo.texture);
        gl.uniform1i(shaderProgram.u.dataTexture, 3);
        // gl.activeTexture(gl.TEXTURE0);
      }
      shaderProgram.u.dpr?.set(dpr);
      if (rd.component.onShaderInit) {
        rd.component.onShaderInit(gl, shaderProgram);
      }
      
      gl.scissor(clipRect.x * dpr, 
                 h - (clipRect.y + clipRect.height) * dpr,
                 clipRect.width * dpr,
                 clipRect.height * dpr);

      shaderProgram.u.startIX.set(rd.startIx);
      gl.drawArrays(gl.TRIANGLES, 0, length * 6);
    }    
    gl.disable(gl.SCISSOR_TEST);

    animationFrame(this.handleFrame);
  }

  static geInstance() {
    if (!rectController) {
      rectController = new RectController();
    }
    return rectController;
  }

  getShaders() {
    return ComponentShaders;
  }

  showExample = (name, options) => {
  }

  compileShader = (name, source, options) => {
    console.log('RectControler compile: ', name, options);
    // TODO get componentInfo for different headers/footer
    let compileInfo = this.gl.getCompileInfo(
      baseComponentShaderHeader + 
          source +
      baseComponentShaderFooter,
      this.gl.FRAGMENT_SHADER,
      2
    );
    if (compileInfo.compileStatus) {
      ComponentShaders[name] = source;
      for (let comp of Object.values(this._componentInfos)) {
        if (comp.shaderName === name) {
          comp._shaderProgram = undefined;
        }
      }
    } else {
      console.log('Shader error: ',compileInfo);
    }
    return compileInfo;
  }

}

let webGLElementHashCount = 1;
/**
 * @param {Element} element
 */
export function getElementHash(element)  {
  if (!element.dataWebGLComponentHash) {
    element.dataWebGLComponentHash = webGLElementHashCount++;
  } 
  return element.dataWebGLComponentHash;
}
