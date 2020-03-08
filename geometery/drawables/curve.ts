import { Shape } from '../shape';
import { Vec } from '../measure';
import { state } from '../../state';

export class Curve extends Shape {
  protected _c: Vec;
  protected _c1: Vec;
  protected _c2: Vec;
  protected _endPos: Vec;
  close = false;

  constructor(position: Vec, controlPoint: Vec, endPosition: Vec)
  constructor(position: Vec, controlPoint1: Vec, controlPoint2: Vec, endPosition: Vec)
  constructor(position: Vec, controlPoint1: Vec, controlPoint2: Vec, endPosition?: Vec) {
    super();

    if (endPosition) {
      this._c1 = controlPoint1.clone();
      this._c2 = controlPoint2.clone();
      this._endPos = endPosition.clone();
    } else {
      this._c = controlPoint1.clone();
      this._endPos = controlPoint2.clone();
    }

    this.pos = position;
  }

  update() {}

  make() {
    state.ctx.beginPath();
    this._path.moveTo(this.absPos.x, this.absPos.y);
    if (!!this._c) this._path.quadraticCurveTo(this._c.x, this._c.y, this._endPos.x, this._endPos.y);
    else this._path.bezierCurveTo(this._c1.x, this._c1.y, this._c1.x, this._c2.y, this._endPos.x, this._endPos.y);
    if (this.close) this._path.closePath();
  }
}