import { PointerTracker } from "../../../KMN-utils-browser/pointer-tracker.js";
import { IRectangle } from "./render-control.js";

/** @type {PointerTracker} */
let globalTracker = null;

export class PointerInfo {
  /**
   * 
   * @param {IRectangle} rectangle 
   */
  constructor(rectangle) {
    if (!globalTracker) {
      globalTracker = new PointerTracker(document.body);
    }
    this.rectangle = rectangle;
    this.info = globalTracker.getLastPrimary();
  }

  update() {
    this.box = this.rectangle.getBoundingClientRect();
    this.info = globalTracker.getLastPrimary();
    this._currentX = this.info.currentX - this.box.x;
    this._currentY = this.info.currentY - this.box.y;
    this._isInside = this.info.isInside &&
      this._currentX >= 0 && this._currentX <= this.box.width && 
      this._currentY >= 0 && this._currentY <= this.box.height;
    // TODO capture if down started inside
    this._isDown = this._isInside && this.info.isDown;
  }

  get currentX() {
    return this._currentX;
  }

  get currentY() {
    return this._currentY;
  }

  get isInside() {
    return this._isInside;
  }

  get isDown() {
    return this._isDown;
  }

  dispose() {
  }
}
