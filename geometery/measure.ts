/**
 * Angle
 * ------------------------------------------------------------------------
 */
export class Angle {
  protected _c: number;
  protected _r: number;

  constructor(size: string)
  constructor(size: number)
  constructor(size: string | number) {
    if (typeof size === 'string') {
      this._c = parseFloat(size);
      this._r = this._c * Math.PI / 180;
    } else {
      this._r = size;
      this._c = this._r * 180 / Math.PI;
    }
  }

  get c() { return this._c; }
  get r() { return this._r; }
  get cos() { return Math.cos(this._r); }
  get sin() { return Math.sin(this._r); }
  get tan() { return Math.tan(this._r); }

  set size(val: string | number) {
    if (typeof val === 'string') {
      this._c = parseFloat(val);
      this._r = this._c * Math.PI / 180;
    } else {
      this._r = val;
      this._c = this._r * 180 / Math.PI;
    }
  }

  clone() {
    return new Angle(this.r);
  }

  getPointInCircle(radius: number, center = new Vec(0, 0)) {
    return new Vec(
      radius * this.cos + center.x,
      radius * this.sin + center.y
    );
  }
}

/**
 * Size
 * ----------------------------------------------------------------------------
 */
export class Size {
  private _w: number;
  private _h: number;

  constructor(width: number, height: number = width) {
    this._w = width;
    this._h = height;
  }

  get w() { return this._w; }
  set w(val: number) {
    this._w = Math.abs(val);
  }
  
  get h() { return this._h; }
  set h(val: number) {
    this._h = Math.abs(val);
  }

  center(pos = new Vec(0,0)) {
    return pos.add(new Vec(this._w / 2, this._h / 2));
  }

  multiply(factor: number) {
    return new Size(this._w * factor, this._h * factor);
  }

  divide(factor: number) {
    return new Size(this._w / factor, this._h / factor);
  }

  add(amount: number): Size
  add(size: Size): Size
  add(size: Size | number) {
    return typeof size === 'number' ? new Size(this._w + size, this._h + size) : new Size(this._w + size.w, this._h + size.h);
  }

  sub(amount: number): Size
  sub(size: Size): Size
  sub(size: Size | number) {
    return typeof size === 'number' ? new Size(this._w - size, this._h - size) : new Size(this._w - size.w, this._h - size.h);
  }

  equals(size: Size) {
    return this.w === size.w && this.h === size.h;
  }

  clone() {
    return new Size(this._w, this._h);
  }
}

/**
 * Flex Size
 * ------------------------------------------------------------------------------
 */
export class FlexSize {
  protected _w: number | 'auto';
  protected _h: number | 'auto';

  constructor(w: number | 'auto', h: number | 'auto' = "auto") {
    this._w = typeof w === 'number' ? Math.abs(w) : 'auto';
    this._h = typeof h === 'number' ? Math.abs(h) : 'auto';
  }

  get w() { return this._w; }
  set w(val: number | 'auto') { this._w = typeof val === 'number' ? Math.abs(val) : val; }
  get h() { return this._h; }
  set h(val: number | 'auto') { this._h = typeof val === 'number' ? Math.abs(val) : val; }

  clone() {
    return new FlexSize(this._w, this._h);
  }

  equals(size: Size) {
    return this.w === size.w && this.h === size.h;
  }
}

/**
 * Point
 * -------------------------------------------------------------------------------
 */
export class Vec {
  protected _x: number;
  protected _y: number;

  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  static maxX(...points: Vec[]) {
    return Math.max(...points.map(p => p.x));
  }

  static maxY(...points: Vec[]) {
    return Math.max(...points.map(p => p.y));
  }

  static max(...points: Vec[]) {
    return new Vec(Math.max(...points.map(p => p.x)), Math.max(...points.map(p => p.y)));
  }

  static minX(...points: Vec[]) {
    return Math.min(...points.map(p => p.x));
  }

  static minY(...points: Vec[]) {
    return Math.min(...points.map(p => p.y));
  }

  static min(...points: Vec[]) {
    return new Vec(Math.min(...points.map(p => p.x)), Math.min(...points.map(p => p.y)));
  }

  get x() { return this._x }
  get y() { return this._y }

  add(point: Vec): Vec
  add(x: number, y: number): Vec
  add(x: number | Vec, y?: number) {
    if (typeof x === "number") return new Vec(this._x + x, this.y + y);
    return new Vec(x.x + this._x, x.y + this._y);
  }

  divide(factor: number) {
    return new Vec(this._x / factor, this._y / factor);
  }

  multiply(factor: number) {
    return new Vec(this._x * factor, this._y * factor);
  }

  opposite() {
    return new Vec(-this._x, -this.y);
  }

  horDistanceFrom(point: Vec) {
    return Math.abs(this._x - point.x);
  }

  verDistanceFrom(point: Vec) {
    return Math.abs(this._y - point.y);
  }

  distanceFrom(point: Vec) {
    return Math.sqrt((this.horDistanceFrom(point) ** 2) + (this.verDistanceFrom(point) ** 2));
  }

  getXYDistanceFrom(point: Vec) {
    return new Size(Math.abs(this._x - point.x), Math.abs(this._y - point.y));
  }

  getVecFrom(point: Vec) {
    return new Vec(this._x - point.x, this._y - point.y);
  }

  getMiddle(point: Vec) {
    return new Vec((this._x + point.x) / 2, (this._y + point.y) / 2)
  }

  match(point: Vec) {
    return this.x === point.x && this.y === point.y;
  }

  center(size: Size) {
    return this.add(size.w / 2, size.h / 2);
  }

  clone() {
    return new Vec(this._x, this._y);
  }
}