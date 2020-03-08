import { Shape } from '../shape';
import { Vec, Size } from '../measure';
import { state } from '../../state';

export class Triangle extends Shape {
  protected _p1: Vec;
  protected _p2: Vec;
  protected _p3: Vec;

  constructor(
    p1: Vec,
    p2: Vec,
    p3: Vec
  ) {
    super();
    this._p1 = p1.clone();
    this._p2 = p2.clone();
    this._p3 = p3.clone();
    super.pos = this.getPosFromPoints();
  }

  protected update() {
    let min = Vec.min(this._p1, this._p2, this._p3);
    let max = Vec.max(this._p1, this._p2, this._p3);
    this.sizeBS.next(min.getXYDistanceFrom(max));
    
    this._corners = [
      this.absPos,
      this.absPos.add(this.size.w, 0),
      this.absPos.add(this.size.w, this.size.h),
      this.absPos.add(0, this.size.h)
    ];
  }
  
  protected getPosFromPoints() {
    return new Vec(Math.min(this._p1.x, this._p2.x, this._p3.x), Math.min(this._p1.y, this._p2.y, this._p3.y));
  }
  
  get center() { return new Vec((this._p1.x + this._p2.x + this._p3.x) / 3, (this._p1.y + this._p2.y + this._p3.y) / 3) }
  get p1() { return this._p1.clone(); }
  get p2() { return this._p2.clone(); }
  get p3() { return this._p3.clone(); }
  get absP1() { return this._p1.add(this._relVec); }
  get absP2() { return this._p2.add(this._relVec); }
  get absP3() { return this._p3.add(this._relVec); }

  get pos() { return this._pos.clone(); }
  set pos(val: Vec) {
    let prevPos = this.pos;
    let offset = new Vec(prevPos.x - val.x, prevPos.y - val.y);
    this._p1 = this._p1.add(offset.opposite());
    this._p2 = this._p2.add(offset.opposite());
    this._p3 = this._p3.add(offset.opposite());

    super.pos = val;
  }

  setPoints(p1?: Vec, p2?: Vec, p3?: Vec) {
    !!p1 && (this._p1 = p1.clone());
    !!p2 && (this._p2 = p2.clone());
    !!p3 && (this._p3 = p3.clone());

    super.pos = this.getPosFromPoints();
  }

  make() {
    state.ctx.beginPath();
    let p1 = this.absP1;
    let p2 = this.absP2;
    let p3 = this.absP3;

    this._path.moveTo(p1.x, p1.y);
    this._path.lineTo(p2.x, p2.y);
    this._path.lineTo(p3.x, p3.y);
    this._path.closePath();
  }
}