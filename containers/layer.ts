import { Unique } from 'tools-box/unique';
import { Shape } from '../geometery/shape';
import { state } from '../state';

export class Layer {
  protected _fixed: boolean;
  readonly id = Unique.Get();
  protected shapes: Shape[] = [];
  visible = true;

  constructor() {}

  get fixed() { return this._fixed; }
  set fixed(val: boolean) {
    if (this._fixed === undefined) {
      this._fixed = val;
      for (let shape of this.shapes) shape.fixed = this._fixed;
    }
  }

  onEvent(event: string, e: MouseEvent) {
    for (let i = this.shapes.length - 1; i > -1; i--) {
      if (!this.shapes[i].actionable || (state.active && state.active !== this.shapes[i].id)) continue;
      if (event === 'mousemove') {
       if (this.shapes[i].mousemoveHandler(e)) return true;
      } else if (event === "mousedown") {
        if (this.shapes[i].mousedownHandler(e)) return true;        
      } else if (event === "mouseup") {
        if (this.shapes[i].mouseupHandler(e)) return true;        
      }
    }

    return false;
  }

  addShape(shape: Shape) {
    if (this.shapes.indexOf(shape) === -1) {
      this.shapes.push(shape);
      if (this._fixed !== undefined) shape.fixed = this._fixed;
    }
  }

  removeShape(shape: Shape) {
    let index = this.shapes.indexOf(shape);

    if (index > -1) {
      shape.destory();
      this.shapes.splice(index, 1);
    }
  }

  clear() {
    for (let shape of this.shapes) shape.destory();
    this.shapes = [];
  }

  bringUp(shape: Shape) {
    let index = this.shapes.indexOf(shape);

    if (index > -1 && index < this.shapes.length - 1)
      this.shapes.splice(index, 2, this.shapes[index + 1], this.shapes[index]);
  }

  bringTop(shape: Shape) {
    let index = this.shapes.indexOf(shape);

    if (index > -1 && index < this.shapes.length - 1) {
      this.shapes.splice(index, 1);
      this.shapes.push(shape);
    }
  }

  pushBack(shape: Shape) {
    let index = this.shapes.indexOf(shape);

    if (index > 0)
      this.shapes.splice(index - 1, 2, this.shapes[index], this.shapes[index - 1]);
  }

  sendBack(shape: Shape) {
    let index = this.shapes.indexOf(shape);

    if (index > 0) {
      this.shapes.splice(index, 1);
      this.shapes.unshift(shape);
    }
  }

  draw() {
    if (!this.visible || !state.ctx) return;

    for (let shape of this.shapes)
      shape.draw();
  }

  destroy() {
    for (let shape of this.shapes)
      shape.destory();

    this.shapes = [];
  }
}