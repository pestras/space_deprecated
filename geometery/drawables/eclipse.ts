import { Shape } from '../shape';
import { Vec, Size } from '../measure';
import { state } from '../../state';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

export class Eclipse extends Shape {  
  protected radiusXBS = new BehaviorSubject<number>(null);
  readonly radiusX$ = this.radiusXBS.pipe(filter(radius => !!radius));
  protected radiusYBS = new BehaviorSubject<number>(null);
  readonly radiusY$ = this.radiusYBS.pipe(filter(radius => !!radius));

  constructor(
    position: Vec,
    radiusX: number,
    radiusY: number
  ) {
    super();
    this.radiusXBS.next(radiusX);
    this.radiusYBS.next(radiusY);
    this.pos = position;
  }

  protected update() {
    this.sizeBS.next(new Size(this.radiusX * 2, this.radiusY * 2));

    this._corners = [
      this.absPos,
      this.absPos.add(this.size.w, 0),
      this.absPos.add(this.size.w, this.size.h),
      this.absPos.add(0, this.size.h)
    ];
  }

  get center() { return this.pos.add(this.radiusX, this.radiusY); }
  get absCenter() { return this.absPos.add(this.radiusX, this.radiusY); }
  get radiusX() { return this.radiusXBS.getValue(); }
  get radiusY() { return this.radiusYBS.getValue(); }
  
  set radiusX(val: number) {
    this.radiusXBS.next(val);
    this.update();
  }
  set radiusY(val: number) {
    this.radiusYBS.next(val);
    this.update();
  }

  make() {
    state.ctx.beginPath();
    let center = this.absCenter;
    this._path.ellipse(center.x, center.y, this.radiusX, this.radiusY, 0, 0, 2 * Math.PI);
  }
}