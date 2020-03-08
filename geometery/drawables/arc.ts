import { Shape } from '../shape';
import { state } from '../../state';
import { Vec, Size, Angle } from '../measure';

export class Arc extends Shape {
  protected _radius: number;
  protected _startAngle: Angle;
  protected _endAngle: Angle;

  constructor(
    position: Vec,
    radius: number,
    startAngle: Angle,
    endAngle: Angle,
    public CCW = false,
    public close = false
  ) {
    super();

    this._radius = radius;
    this._startAngle = startAngle;
    this._endAngle = endAngle;
    this.pos = position;
  }

  update() {
    let p1 = this._startAngle.getPointInCircle(this._radius, this.absPos);
    let p3 = this._endAngle.getPointInCircle(this._radius, this.absPos);
    let p2 = new Angle((this._startAngle.r + this._endAngle.r) / 2).getPointInCircle(this._radius, this.absPos);
    let minPoint = Vec.min(p1, p2, p3);
    let maxPoint = Vec.max(p1, p2, p3);
    this.sizeBS.next(minPoint.getXYDistanceFrom(maxPoint));

    this._corners = [
      minPoint,
      new Vec(maxPoint.x, minPoint.y),
      maxPoint,
      new Vec(minPoint.x, maxPoint.y)
    ];
  }

  get radius() { return this._radius; }
  set radius(val: number) {
    this._radius = val;
    this.update();
  }
  get startAngle() { return this._startAngle.clone(); }
  set startAngle(val: Angle) {
    this._startAngle = val.clone();
    this.update();
  }
  get endAngle() { return this._endAngle.clone(); }
  set endAngle(val: Angle) {
    this._endAngle = val.clone();
    this.update();
  }

  make() {
    state.ctx.beginPath();
    this._path.arc(this.absPos.x, this.absPos.y, this._radius, this._startAngle.r, this._endAngle.r, this.CCW);
    if (this.close) this._path.closePath();
  }
}