import { Vec } from './measure';
import { ISpace } from '../space.interface';

export class MouseCoords extends Vec {
  space: ISpace;

  constructor(space: ISpace, point: Vec)
  constructor(space: ISpace, x: number, y: number)
  constructor(space: ISpace, x: number | Vec, y?: number) {
    if (typeof x === "number") super(x, y);
    else super(x.x, x.y);
    this.space = space;
  }

  static From(space: ISpace, pos: Vec) {
    return new Vec(
      (pos.x / space.scale) - (space.translate.x / space.scale),
      (pos.y / space.scale) - (space.translate.y / space.scale)
    )
  }

  get x() { return (this._x / this.space.scale) - (this.space.translate.x / this.space.scale) }
  get y() { return (this._y / this.space.scale) - (this.space.translate.y / this.space.scale) }

  toVec() {
    return new Vec(this.x, this.y);
  }

  add(point: Vec): MouseCoords
  add(x: number, y: number): MouseCoords
  add(x: number | Vec, y?: number) {
    if (typeof x === "number") return new MouseCoords(this.space, this._x + x, this.y + y);
    return new MouseCoords(this.space, x.x + this._x, x.y + this._y);
  }

  clone() {
    return new MouseCoords(this.space, this._x, this._y);
  }
}