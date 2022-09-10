import { PointerTracker } from "../../../KMN-utils-browser/pointer-tracker.js";

/** @type {PointerTracker} */
let globalTracker = null;

export class PointerInfo {
  /**
   * 
   * @param {import("../../TS/varstack-browser.js").IRectangle} rectangle 
   */
  constructor(rectangle) {
    if (!globalTracker) {
      globalTracker = new PointerTracker(window, { cancelEvents: false });
    }
    this.rectangle = rectangle;
    this.info = globalTracker.getLastPrimary();
    this.update();
  }

  checkInside(x, y) {
    return x >= 0 && x <= this.box.width &&
      y >= 0 && y <= this.box.height;
}

  update() {
    this.box = this.rectangle.getBoundingClientRect();
    this.info = globalTracker.getLastPrimary();
    this.currentX = this.info.currentX - this.box.x;
    this.currentY = this.info.currentY - this.box.y;
    let btn0 = this.info?.buttons?.[0];
    let down = btn0?.down;
    // pointer tracker stores down position so we can check if we are in capture mode of this button
    let downInside = down && this.checkInside(btn0.x - this.box.x, btn0.y - this.box.y);
    // check if inside or captured but not captured by another
    this.isInside = (this.checkInside(this.currentX, this.currentY) || downInside) && !(down && !downInside);
    // by using isindie we are sure that the down is for us
    this.isDown = this.isInside && down;
  }

  dispose() {
  }
}
