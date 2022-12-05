import { animationFrame } from "../../../KMN-utils-browser/animation-frame.js";
import getWebGLContext, { RenderingContextWithUtils, WebGLProgramExt } from "../../../KMN-utils.js/webglutils.js";
import { BaseBinding } from "../../../KMN-varstack.js/vars/base.js";
import { BaseDemoComponent } from "./component-base.js";
import { ComponentShaderIncludes } from "./component-shader-includes.js";
import { ComponentShaders } from "./component-shaders.js";

const getBaseVertexShader = (options) => /*glsl*/`
uniform sampler2D dataTexture;
uniform vec2 canvasResolution;
uniform float dpr;
uniform int startIX;
out vec2 localCoord;

${options.flat}out vec4 posAndSize;
${options.flat}out vec4 mouse;
${options.flat}out vec4 value;

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

/**
 *
 * @param {{flat:string}} options
 * @returns
 */
export const getBaseComponentShaderHeader = (options) => /*glsl*/`
precision highp float;

uniform int drawCount;

in vec2 localCoord;
${options.flat}in vec4 posAndSize;
${options.flat}in vec4 mouse;
${options.flat}in vec4 value;

#define mouseInsideOrDown (mouse.z>0.0)
#define mouseInside ((int(mouse.z) & 0x01) != 0)
#define mouseDown ((int(mouse.z) & 0x02) != 0)
#define mouseFineTune ((int(mouse.z) & 0x04) != 0)
`;

export const baseComponentShaderFooter = /*glsl*/`

out vec4 fragColor;
void main(void) {
  fragColor = renderComponent(posAndSize.xy, posAndSize.zw);
}`;


export class BaseRectangleBinding extends BaseBinding {

}

/** @typedef {(info:RectInfo) => {}} UpdateFunc */
/** @typedef {(info:ComponentInfo)=>void} ComponentUpdateFunc */
/** @typedef {(gl: RenderingContextWithUtils, shaderProgram: import("../../../KMN-utils.js/webglutils.js").WebGLProgramExt)=>void} ShaderInitFunc */

export class RectInfo {
  /** @type {UpdateFunc} */ onUpdate;
  rect = { x: 0, y: 0, width: 32, height: 32 };
  size  = {centerX:0, centerY:0, width:0, height:0};
  mouse = {x:0, y:0, state:0, enterTime:0};
  value = [0,0,0,0];
}

function getComponentKey(clipHash, shaderName) {
  return clipHash + '_' + shaderName;
}

export class ComponentInfo {
  /**
   *
   * @param {RenderControl} owner
   */
  constructor(owner) {
    this.owner = owner;
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
    return getBaseComponentShaderHeader(this.owner.shaderOptions) + ComponentShaders[this.shaderName] + baseComponentShaderFooter;
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
    this._rectInfos.push(rectInfo);
    rectInfo.onUpdate = onUpdate;
    return rectInfo;
  }

  /** @param {RectInfo} info */
  freeRectInfo(info) {
    let ix = this._rectInfos.indexOf(info);
    if (ix !== -1) {
      this._rectInfos.splice(ix, 1);
    }
  }

  /**
   * @param {RenderingContextWithUtils} gl
   */
  getShaderProgram(gl) {
    if (this._shaderProgram === undefined) {
      let sc = this.owner.shaderCache[this.shaderName];
      let source = this.getShader();
      if (sc && sc.source === source && sc.shaderProgram) {
        this._shaderProgram = sc.shaderProgram;
      } else {
        this._shaderProgram = gl.getShaderProgram(
          getBaseVertexShader(this.owner.shaderOptions),
          this.owner.handleIncludes(this.getShader()),
          // this.shaderHeader +
          //   ComponentShaders[this.shaderName] +
          // this.shaderFooter,
          2
        );
        // console.info('Shader compiled: ', this.shaderName);
        this.owner.shaderCache[this.shaderName] = {
          ...this.owner.shaderCache[this.shaderName],
          ...{
            source,
            shaderProgram: this._shaderProgram
          }
        };
      }
    }
    return this._shaderProgram;
  }
}

class CanvasUpdateGroup {
  constructor(name) {
    this.name = name;
    /** @type {CanvasUpdateRoutine[]} */
    this.routines = [];
    this.errorCount = 0;
  }
}

class CanvasUpdateRoutine {
  /**
   * @param {CanvasUpdateGroup} owner
   * @param {()=>void} routine
   * @param {import("../../TS/varstack-browser.js").IRectangle} clipElement
   */
  constructor(owner, routine, clipElement) {
    this.owner = owner;
    this.routine = routine;
    this.clipElement = clipElement;
  }

  registerShader(name, vertexFunc, fragmentFunc) {
    // TODO: add to global shadercache, strip body and make it setable in component editor
    this.vertexFunc = vertexFunc;
    this.fragmentFunc = fragmentFunc;
  }
}


/** @type {RenderControl} */
let renderControl = null;
const floatSizePerComponent = 16;
export class RenderControl {
  constructor() {
    // TODO seperate shaderInfo from componentInfo by registering ShaderInfo for shaderName
    /** @type {Record<string,ComponentInfo>} */
    this._componentInfos = {};
    this._arrayLength = 256;
    this._webglArray = new Float32Array(this._arrayLength * floatSizePerComponent);
    this._textureInfo = { texture: undefined, size: 0, bufferWidth: 1024 }
    /** @type {Record<string,CanvasUpdateGroup>} */
    this._otherCanvasRoutines = {};
    this._otherCanvasKeys = [];
    this.drawingDisabled = false;
    this.frameDivider = 1;
    this.errorCount = 0;
    this.dpr = 1;
    /** @type {Record<string,{demoClass:{new(levelVar, element, shaderName) : BaseDemoComponent}, controlClass: {new(el)}}>} */
    this.registeredShaders = {};
    this.shaderCache = {};
    this.drawComponentsEnabled = true;
    this.ignoreClipRect = false;
    this.currentShader = null;
    this.currentClipElement = null;
    this.retinaDisabled = false;
    this.vertexIDWorkaroundBuffer = null;
    /** @type {Record<string,WebGLProgramExt>} */
    this.webGLPrograms = {};
    this.calcTimeAvg = 1;

    this.shaderOptions = {
      vertexIDDisabled: false,
      flat: 'flat '
    }
  }

  /**
   * Makes an int array GL buffer with 1,2,3, etc because Vertex_ID is unstable on Mac (Retina 5K, Late 2015) AMD Radeon R9 M395X 4 GB
   * I use this as a vertex buffer to circumvent that problem
   * @returns {WebGLBuffer}
   */
   getVertex_IDWorkaroundBuffer() {
    const gl = this.gl;
    if (!this.vertexIDWorkaroundBuffer) {
      const maxVertexID = 1024 * 1024 * 4;
      let data = new Float32Array(maxVertexID); // Can't get Int to work on my mac :( Vertex shader input type does not match the type of the bound vertex attribute. int

      for (let ix = 0; ix < maxVertexID; ix++) {
        data[ix] = ix;
      }
      this.vertexIDWorkaroundBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexIDWorkaroundBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_READ);
    }
    return this.vertexIDWorkaroundBuffer;
  }

  disableVertexID(val) {
    this.shaderOptions.vertexIDDisabled = val;
  }

  getVertexIDDiabled(val) {
    return this.shaderOptions.vertexIDDisabled;
  }

  disableRetina(val) {
    this.retinaDisabled = val;
  }

  updateCanvasSize() {
    if (!this.canvasSize) {
      const canvas = this.canvas;
      let dpr = devicePixelRatio;
      if (this.retinaDisabled) {
        dpr = Math.min(dpr, 1);
      }
      // let w = canvas.offsetWidth * dpr;
      // let h = canvas.offsetHeight * dpr;
      let w = window.innerWidth * dpr;
      let h = window.innerHeight * dpr;
      if (w !== canvas.width ||
        h !== canvas.height) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
      }
      this.canvasSize = { w, h, dpr };
    }

    return this.canvasSize;
  }

  /**
   *
   * @param {string} shaderId
   * @param {(options)=>String} vertFunc
   * @param {(options)=>String} fragFunc
   * @returns {WebGLProgramExt}
   */
  checkUpdateShader2(shaderId, vertFunc, fragFunc) {
    const gl = this.gl;
    let shader = this.webGLPrograms[shaderId];
    let vertStr = vertFunc(this.shaderOptions);
    let fragStr = fragFunc(this.shaderOptions);
    if (!shader ||
        (vertStr !== shader.lastVertStr) ||
        (fragStr !== shader.lastFragStr)) {
      shader = gl.getShaderProgram(
        vertStr,
        fragStr,
        2);
      // console.info('Shader loaded: ', shaderId);
      shader.lastVertStr = vertStr;
      shader.lastFragStr = fragStr;
      this.webGLPrograms[shaderId] = shader;
    }
    return shader;
  }

  updateShaderAndSize(obj, shader, parentElement, clipElement = null) {
    // TODO: This needs to be cleared after every frame!
    const gl = this.gl
    this.shaderRuns++;
    if (this.currentShader !== shader || (clipElement !== this.currentClipElement && !this.ignoreClipRect)) {
      this.currentShader = shader;
      this.currentClipElement = clipElement;

      let { w, h, dpr } = this.updateCanvasSize();
      let ch = h;
      let rect = parentElement.getBoundingClientRect();
      if (rect.width && rect.height) {
        this.viewBoxSet++;
        gl.viewport(rect.x * dpr, h - (rect.y + rect.height) * dpr, rect.width * dpr, rect.height * dpr);
        obj.width = w = rect.width * dpr;
        obj.height = h = rect.height * dpr;

        this.shadersLoaded++;
        gl.useProgram(shader);

        shader.u.windowSize?.set(w, h);
        shader.u.dpr?.set(dpr);
      } else {
        obj.width = w = 0;
        obj.height = h = 0;
      }

      if (!this.ignoreClipRect) {
        if (clipElement) {
          let clipRect = clipElement.getBoundingClientRect();
          this.clipBoxSet++;
          gl.scissor(clipRect.x * dpr,
            ch - (clipRect.y + clipElement.clientHeight) * dpr,
            clipElement.clientWidth * dpr,
            clipElement.clientHeight * dpr);
          gl.enable(gl.SCISSOR_TEST);
        } else {
          gl.disable(gl.SCISSOR_TEST);
        }
      }

      this.currentShaderSize = { w, h };
      return w > 0 && h > 0;
    } else {
      let size = this.currentShaderSize;
      obj.width = size.w;
      obj.height = size.h;
      return size.w > 0 && size.h > 0;
    }
  }


  /**
   *
   * @param {ComponentInfo} info
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
   static setClipBoxFromElement(info, element) {
    let box = element.getBoundingClientRect();
    info.clipRect.width  = box.width; // element.clientWidth;
    info.clipRect.height = box.height; // element.clientHeight;
    info.clipRect.x = box.x;
    info.clipRect.y = box.y;
  }
  /**
   *
   * @param {RectInfo} info
   * @param {import("../../TS/varstack-browser.js").IRectangle} element
   */
  static setBoxDataFromElement(info, element) {
    let box = element.getBoundingClientRect();

    info.rect.width  = box.width;
    info.rect.height = box.height;
    info.rect.x      = box.x;
    info.rect.y      = box.y;

    info.size.centerX = box.width / 2;
    info.size.centerY = box.height / 2;

    info.size.width   = box.width;
    info.size.height  = box.height;
  }

  /**
   * Register another routine that draws on the canvas, they are grouped by name
   * @param {string} name
   * @param {() => {}} updateCanvasRoutine
   * @param {import("../../TS/varstack-browser.js").IRectangle} clipElement
   * @returns {CanvasUpdateRoutine} Id for the registered routine, unique for its name
   */
  registerCanvasUpdate(name, updateCanvasRoutine, clipElement) {
    let canvasUpdateGroup = this._otherCanvasRoutines[name];
    if (!canvasUpdateGroup) {
      canvasUpdateGroup = this._otherCanvasRoutines[name] = new CanvasUpdateGroup(name);
    }
    let canvasRoutine = new CanvasUpdateRoutine(canvasUpdateGroup, updateCanvasRoutine, clipElement)
    canvasUpdateGroup.routines.push(canvasRoutine);
    this._otherCanvasKeys = Object.keys(this._otherCanvasRoutines);
    return canvasRoutine;
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
      componentInfo = new ComponentInfo(this);
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
    this.gl = getWebGLContext(this.canvas, { alpha: true, desynchronized: true });
    const ext = this.gl.getExtension('EXT_color_buffer_float');

    this.drawCount = 0;
    animationFrame(this.handleFrame)
  }


  drawComponents() {
    let gl = this.gl;
    let { w, h, dpr } = this.updateCanvasSize();
    this.dpr = dpr;

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
                if (((si.mouse.state & 0x02) !== 0) === (foreground === 1)) {
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
                foreground,
                startIx,
                component,
                componentLength
              });
            }
          }
        }
      }
      // console.log(pos / 16);
    }

    gl.enable(gl.SCISSOR_TEST);

    this._textureInfo = gl.createOrUpdateFloat32TextureBuffer(this._webglArray, this._textureInfo);
    for (const rd of renderData) {
      const length = rd.componentLength;
      const clipRect = rd.component.clipRect;
      const shaderProgram = rd.component.getShaderProgram(gl);
      this.shaderRuns++;
      this.shadersLoaded++;
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
        gl.bindTexture(gl.TEXTURE_2D, this._textureInfo.texture);
        gl.uniform1i(shaderProgram.u.dataTexture, 3);
        // gl.activeTexture(gl.TEXTURE0);
      }
      shaderProgram.u.dpr?.set(dpr);
      if (rd.component.onShaderInit) {
        rd.component.onShaderInit(gl, shaderProgram);
      }
      if (rd.foreground) {
        gl.disable(gl.SCISSOR_TEST);
      } else {
        this.clipBoxSet++;
        gl.scissor(clipRect.x * dpr,
          h - (clipRect.y + clipRect.height) * dpr,
          clipRect.width * dpr,
          clipRect.height * dpr);
      }

      shaderProgram.u.startIX.set(rd.startIx);
      gl.drawArrays(gl.TRIANGLES, 0, length * 6);
    }
    gl.disable(gl.SCISSOR_TEST);
  }

  disableDrawing(state) {
    this.drawingDisabled = state;
  }

  handleFrame = () => {
    if (!this.drawingDisabled) {
      this.drawCount++;
      if (this.drawCount % this.frameDivider === 0) {
        let start = globalThis.performance.now();
        this.currentShader = null;
        this.currentClipElement = null;
        this.canvasSize = null;
        this.shaderRuns = 0;
        this.shadersLoaded = 0;
        this.viewBoxSet = 0;
        this.clipBoxSet = 0;
        this.canvasRoutines = 0;

        let { w, h, dpr } = this.updateCanvasSize();
        const gl = this.gl;
        gl.viewport(0, 0, w, h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(this.gl.BLEND);
        gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        try {
          if (this.drawComponentsEnabled) {
            this.drawComponents();
          }
          this.errorCount = 0;
        } catch (e) {
          if (this.errorCount++ < 2) {
            console.error('Error rendering components: ', e);
          }
        }


        // Draw other canvas functions
        for (let key of this._otherCanvasKeys) {
          let routines = this._otherCanvasRoutines[key];
          try {
            for (let routine of routines.routines) {
              this.canvasRoutines++;
              routine.routine();
            }
            routines.errorCount = 0;
          } catch (e) {
            if (routines.errorCount++ < 2) {
              console.error('Error rendering: ', routines, e);
            }
          }
        }

        if (this.drawCount % 60 === 0) {
          // console.log('SD:',this._otherCanvasKeys.length, this.canvasRoutines, this.shaderRuns, this.shadersLoaded, this.viewBoxSet, this.clipBoxSet);
        }

        let stop = globalThis.performance.now();
        this.calcTimeAvg = this.calcTimeAvg * 0.99 + 0.01 * (stop - start);
      }
    }
    this.gl.disable(this.gl.SCISSOR_TEST);
    animationFrame(this.handleFrame);
  }

  static geInstance() {
    if (!renderControl) {
      renderControl = new RenderControl();
    }
    return renderControl;
  }

  getShaders() {
    return this.registeredShaders;
  }

  /**
   *
   * @param {string} shaderName
   * @param {{new(levelVar, element, shaderName)}} demoClass
   * @param {{new(...params)}} controlClass
   */
  registerShader(shaderName, demoClass, controlClass) {
    this.registeredShaders[shaderName] = {
      demoClass,
      controlClass
    };
  }

  showExample = (name, options) => {
  }

  // TODO move these functions to str utils or so
  /**
   *
   * @param {string} str
   * @returns {string[]}
   */
  strToLines(str) {
    const CRLFregEx = new RegExp('\r\n', 'g');
    str = str.replace(CRLFregEx, '\n');
    return str.split('\n');
  }

  handleIncludes(sourceStr) {
    let sourceLines = this.strToLines(sourceStr);
    let result = [];
    for (let line of sourceLines) {
      result.push(line);
      line = line.trim();
      if (line.startsWith('//')) {
        line = line.substring(3).trim();
        if (line.startsWith('#include')) {
          line = line.substring(8).trim();
          let includeScript = ComponentShaderIncludes[line];
          if (includeScript) {
            // console.log('Include handled: ', line);
            result.push(includeScript);
          } else {
            console.error('Include not found: ', line);
          }
        }
      }
    }
    return result.join('\n');
  }

  compileShader = (name, source, options) => {
    // console.log('RectControler compile: ', name, source, options);
    // TODO get componentInfo for different headers/footer
    let sc = this.shaderCache[name];
    if (sc && sc.source === source) {
      return sc.compileInfo;
    }
    let compileInfo = this.gl.getCompileInfo(
      getBaseComponentShaderHeader(this.shaderOptions) +
      this.handleIncludes(source) +
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
    this.shaderCache[name] = {
      ...this.shaderCache[name],
      ...{
        source,
        compileInfo,
        shaderProgram: 0
      }
    };
    return compileInfo;
  }
}

let webGLElementHashCount = 1;
/**
 * @param {import("../../TS/varstack-browser.js").IRectangle} element
 */
export function getElementHash(element)  {
  if (!element.dataWebGLComponentHash) {
    element.dataWebGLComponentHash = webGLElementHashCount++;
  }
  return element.dataWebGLComponentHash;
}



/*

  Some thoughts for improvement

    ShaderProgram => placeholder for vertex+fragment shader and
    Controller => placeholder for mouse/touch/kbd control behaviour, calls ShaderInfo to set a set of parameters
    Component => Placeholder for a component class => shaderProgram + controller

    ClipInfo => Placeholder for the clipping rectangle
    RectInfo => Placeholder for the drawing rectangle

    ComponentInstance
      ComponentInfo
      ClipInfo
      RectInfo

    RenderInfoGroup
      ComponentInfo
      ClipInfo
      instances
      instanceStartInArray

  These should be queryable interface on ControllerInfo
    ExtendedControllerInfo => extends ControllerInfo with extra info, should contain demo data (scope, miditrack, beatgrid, audioview etc)
    PanZoomControllerInfo => extends ControllerInfo with basepanzoom controler

  RectController changes, now called RenderControl
    Can we use ext ControllerInfo to run canvasroutines as Components? no we need to overule draw event, but could re-use logic by composition
    What to do with draw order, hidden cliprects/rectangles handle efficiently
    Can we manage and render text in here
    Can we use uniform blocks to speed up things

  Steps to render
    group by ShaderProgram & ClipInfo
      -now done in draw per frame, better to prepare and assign place in vertex pull array for all components
      -loop with scissor function after loading shader doing the draw calls per clip region
      -drawCalls can be called per block (like now)
    update their data
      -All instances ComponentInstance.update
      -Once Per group before shader exec
         ComponentInfo.update(gl,shader) replaces shaderinit
         Cliprect.update(gl) replaces onupdate in componentinfo

  We should be able to work without html elements here so we can make synthpanels

  Default colors could also be color functions for gradients?
    -they would need center info (dist), mouseInfo and localCoord
*/
