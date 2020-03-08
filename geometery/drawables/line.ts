import { Shape } from '../shape';
import { state } from '../../state';
import { Vec } from '../measure';

export class Line extends Shape {
  protected _end: Vec;

  constructor(start: Vec, end: Vec) {
    super();

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
    state.ctx.beginPath();
    this._path.moveTo(this.absPos.x, this.absPos.y);
    this._path.lineTo(this._end.x, this._end.y);
  }
}