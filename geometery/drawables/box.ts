import { Shape } from '../shape';
import { Vec } from '../measure';
import { state } from '../../state';

export class Box extends Shape {
  protected _shapes: Shape[] = [];
  protected _padding: [number, number, number, number] = [0, 0, 0, 0];

  constructor(position: Vec) {
    super();

    this.pos = position;
  }

  update() {
    let minVecs = this._shapes.map(shape => Vec.min(...shape.corners));
    let maxVecs = this._shapes.map(shape => Vec.max(...shape.corners));
    let min = Vec.min(...minVecs);
    let max = Vec.max(...maxVecs);
    let size = min.getXYDistanceFrom(max);
    this.sizeBS.next(size);
    this._corners = [
      this.absPos,
      this.absPos.add(this.size.w, 0),
      this.absPos.add(this.size.w, this.size.h),
      this.absPos.add(0, this.size.h)
    ];
  }

  addShapes(...shapes: Shape[]) {
    for (let shape of shapes) {
      shape.relate(this);
      this._shapes.push(shape);
    };
    this.update();
  }

  removeShape(shape: Shape) {
    let index = this._shapes.indexOf(shape);
    if (index > -1) {
      shape.unrelate();
      this._shapes.splice(index, 1);
    }
  }

  clear() {
    for (let shape of this._shapes) shape.unrelate();
    this._shapes = [];
  }

  destory() {
    this._shapes = [];
    super.destory();
  }

  set padding(val: [number, number?, number?, number?]) {
    if (val.length === 1) this._padding = [val[0], val[0] * 2, val[0] * 2, val[0]];
    else if (val.length === 2) this._padding = [val[0], val[1] * 2, val[0] * 2, val[1]];
    else if (val.length === 3) this._padding = [val[0], val[1] * 2, val[2] + val[0], val[1]];
    else this._padding = [val[0], val[1] + val[3], val[2] + val[0], val[3]];
  }

  make() {
    this.update();
    state.ctx.beginPath();
    let size = this.size;

    if (this._style.radius > 0) {
      let radius = this._style.radius;
      if (size.w / 2 < radius) radius = size.w / 2;
      if (size.h / 2 < radius) radius = size.h / 2;

      this._path.moveTo(this._corners[0].x + this._style.radius - this._padding[3], this._corners[0].y - this._padding[0]);
      this._path.arcTo(this._corners[1].x + this._padding[1], this._corners[1].y - this._padding[0], this._corners[2].x + this._padding[1], this._corners[2].y + this.padding[2], radius);
      this._path.arcTo(this._corners[2].x + this._padding[1], this._corners[2].y + this._padding[2], this._corners[3].x - this._padding[3], this._corners[3].y + this._padding[2], radius);
      this._path.arcTo(this._corners[3].x - this._padding[3], this._corners[3].y + this._padding[2], this._corners[0].x - this._padding[3], this._corners[0].y - this._padding[1], radius);
      this._path.arcTo(this._corners[0].x - this._padding[3], this._corners[0].y - this._padding[0], this._corners[1].x + this._padding[1], this._corners[1].y - this._padding[0], radius);
      this._path.closePath();

    } else {
      console.log(this._corners[0].x - this._padding[3],
        this._corners[0].y - this._padding[0],
        size.w + this._padding[1],
        size.h + this._padding[2])
      this._path.rect(
        this._corners[0].x - this._padding[3],
        this._corners[0].y - this._padding[0],
        size.w + this._padding[1],
        size.h + this._padding[2]
      );
    }
  }
} 