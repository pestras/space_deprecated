import { Shape } from '../shape';
import { Vec, Size } from '../measure';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ISpace } from '../../space.interface';

export class Circle extends Shape {  
  // position observer
  protected radiusBS = new BehaviorSubject<number>(null);
  readonly radius$ = this.radiusBS.pipe(filter(radius => !!radius));

  constructor(
    space: ISpace,
    position: Vec,
    radius: number
  ) {
    super(space);
    this.radiusBS.next(radius);
    this.pos = position;
  }
  
  protected update() {
    let radius = this.radius;
    this.sizeBS.next(new Size(this.radius * 2, this.radius * 2));
    let pos = this.pos;

    this._corners = [
      this.absPos,
      this.absPos.add(this.size.w, 0),
      this.absPos.add(this.size.w, this.size.h),
      this.absPos.add(0, this.size.h)
    ];
  }

  get center() { return this.pos.add(this.size.w / 2, this.size.h / 2); }
  get absCenter() { return this.absPos.add(this.size.w / 2, this.size.h / 2); }
  get radius() { return this.radiusBS.getValue(); }
  
  set radius(val: number) {
    this.radiusBS.next(val);
    this.update();
  }

  make() {
    this.space.ctx.beginPath();
    let center = this.absCenter;
    this._path.arc(center.x, center.y, this.radius, 0, 2 * Math.PI);
  }
}