import { Shape } from '../shape';
import { Vec, Size } from '../measure';
import { state } from '../../state';

export class Rectangle extends Shape {

  constructor(
    position: Vec,
    size: Size,
  ) {
    super();
    this.sizeBS.next(size);
    this.pos = position;
  }

  protected update() {
    this._corners = [
      this.absPos,
      this.absPos.add(this.size.w, 0),
      this.absPos.add(this.size.w, this.size.h),
      this.absPos.add(0, this.size.h)
    ];
  }

  set size(val: Size) {
    this.sizeBS.next(val);
    this.update();
  }

  make() {
    state.ctx.beginPath();
    let size = this.size;

    if (this._style.radius > 0) {
      let radius = this._style.radius;
      if (size.w / 2 < radius) radius = size.w / 2;
      if (size.h / 2 < radius) radius = size.h / 2;

      this._path.moveTo(this._corners[0].x + this._style.radius, this._corners[0].y);
      this._path.arcTo(this._corners[1].x, this._corners[1].y, this._corners[2].x, this._corners[2].y, radius);
      this._path.arcTo(this._corners[2].x, this._corners[2].y, this._corners[3].x, this._corners[3].y, radius);
      this._path.arcTo(this._corners[3].x, this._corners[3].y, this._corners[0].x, this._corners[0].y, radius);
      this._path.arcTo(this._corners[0].x, this._corners[0].y, this._corners[1].x, this._corners[1].y, radius);
      this._path.closePath();

    } else {
      this._path.rect(this._corners[0].x, this._corners[0].y, size.w, size.h);
    }
  }
}