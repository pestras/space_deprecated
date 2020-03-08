import { Vec } from './measure';
import { state } from '../state';

export class MouseCoords extends Vec {

  constructor(point: Vec)
  constructor(x: number, y: number)
  constructor(x: number | Vec, y?: number) {
    if (typeof x === "number") super(x, y);
    else super(x.x, x.y);
  }

  get x() { return (this._x / state.scale) - (state.translate.x / state.scale) }
  get y() { return (this._y / state.scale) - (state.translate.y / state.scale) }

  toVec() {
    return new Vec(this.x, this.y);
  }

  add(point: Vec): MouseCoords
  add(x: number, y: number): MouseCoords
  add(x: number | Vec, y?: number) {
    if (typeof x === "number") return new MouseCoords(this._x + x, this.y + y);
    return new MouseCoords(x.x + this._x, x.y + this._y);
  }

  clone() {
    return new MouseCoords(this._x, this._y);
  }
}