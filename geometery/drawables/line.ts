import { Shape } from '../shape';
import { Vec } from '../measure';
import { ISpace } from '../../space.interface';

export class Line extends Shape {
  protected _end: Vec;

  constructor(space: ISpace,start: Vec, end: Vec) {
    super(space);

    this._end = end.clone();
    this.pos = start;
  }
  
  update() {
    this.sizeBS.next(this.pos.getXYDistanceFrom(this._end));
  }

  get start() { return this.pos; }
  set start(val: Vec) {
    this.pos = val;
  }

  get end() { return this._end.clone() }
  set end(val: Vec) {
    this._end = val.clone();
    this.update();
  }

  make() {
    this.space.ctx.beginPath();
    this._path.moveTo(this.absPos.x, this.absPos.y);
    this._path.lineTo(this._end.x, this._end.y);
  }
}