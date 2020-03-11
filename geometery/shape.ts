import { Subscription, BehaviorSubject, Subject } from 'rxjs';
import { Unique } from 'tools-box/Unique';
import { state, Style } from '../state';
import { Vec, Size } from './measure'
import { filter } from 'rxjs/operators';
import { MouseCoords } from './mouse-point';

export abstract class Shape {
  protected _subscriptions: Subscription[] = [];
  protected _attachSub: Subscription;
  protected _attachDestroySub: Subscription;
  protected _relSub: Subscription;
  protected _relDestroySub: Subscription;
  protected _dragSubs: Subscription;
  protected _path = new Path2D();
  protected _pos: Vec;
  protected _rel: Shape;
  protected _relVec = new Vec(0, 0);
  protected _attach: Shape;
  protected _attachVec: Vec;
  protected _corners: [Vec, Vec, Vec, Vec];
  protected _clip: Shape = null;
  // status attr
  protected _mousein = false;
  protected _dragStart = false;
  protected _drag = false;
  protected _actionable = true;

  readonly _style = Object.assign({}, state.style);

  id = Unique.Get();
  draggable = false;
  visible = true;

  // absolute position observer
  protected absPosBS = new BehaviorSubject<Vec>(null);
  readonly absPos$ = this.absPosBS.pipe(filter(pos => !!pos));
  // absolute position observer
  protected sizeBS = new BehaviorSubject<Size>(null);
  readonly size$ = this.sizeBS.pipe(filter(pos => !!pos));
  // destroy observer
  protected destroyBS = new Subject<void>();
  readonly destroy$ = this.destroyBS.asObservable();

  // mousein observer
  protected mouseinBS = new Subject<MouseEvent>();
  readonly mousein$ = this.mouseinBS.asObservable();
  // mouseout observer
  protected mouseoutBS = new Subject<MouseEvent>();
  readonly mouseout$ = this.mouseoutBS.asObservable();
  // mouseclick observer
  protected clickBS = new Subject<MouseEvent>();
  readonly click$ = this.clickBS.asObservable();
  // dragstart observer
  protected dragstartBS = new Subject<MouseEvent>();
  readonly dragstart$ = this.dragstartBS.asObservable();
  // drag observer
  protected dragBS = new Subject<MouseEvent>();
  readonly drag$ = this.dragBS.asObservable();
  // dragend observer
  protected dragendBS = new Subject<MouseEvent>();
  readonly dragend$ = this.dragendBS.asObservable();

  constructor() {
    this.drag$.subscribe(e => {
      if (!this.draggable) return;
      this.pos = new MouseCoords(e.offsetX, e.offsetY).toVec().add(this._relVec.opposite());
    });
  }

  protected styleChanged(prop: (keyof Style)[]) { }

  abstract make(): void;

  protected makeClip() {
    this.make();
    state.ctx.clip(this._path);
  }

  draw(): void {
    if (!this.visible) return;
    state.ctx.save();

    if (this._clip) this._clip.makeClip();

    this._path = new Path2D();
    this.make();

    if (this._style.shadow) {
      state.ctx.shadowOffsetX = this._style.shadow[0];
      state.ctx.shadowOffsetY = this._style.shadow[1];
      state.ctx.shadowBlur = this._style.shadow[2];
      state.ctx.shadowColor = this._style.shadow[3];
    }

    state.ctx.globalAlpha = this._style.alfa;

    if (this._style.fill) {
      state.ctx.fillStyle = this._style.fill;
      state.ctx.fill(this._path);
    }

    if (this._style.strokeStyle && this._style.lineWidth > 0) {
      state.ctx.strokeStyle = this._style.strokeStyle;
      state.ctx.lineWidth = this._style.lineWidth;
      state.ctx.lineCap = this._style.lineCap;
      state.ctx.lineJoin = this._style.lineJoin;
      !!this._style.lineDash && state.ctx.setLineDash(this._style.lineDash);
      state.ctx.stroke(this._path);
    }

    state.ctx.restore();
  }

  protected abstract update(): void;

  protected isPointIn(point: Vec): boolean {
    return state.ctx.isPointInPath(
      this._path,
      (point.x / state.scale) - (state.translate.x / state.scale),
      (point.y / state.scale) - (state.translate.y / state.scale)
    );
  }

  // status getters
  get attached() { return this._attach; }
  get mousein() { return this._mousein; }
  get drag() { return this._drag; }
  get absPos(): Vec { return this.absPosBS.getValue(); }
  get pos(): Vec { return this._pos.clone(); }
  get size(): Size { return this.sizeBS.getValue(); }
  get corners() { return this._corners.map(corner => corner.clone()); }
  get actionable() { return this._actionable; }

  set actionable(val: boolean) {
    this.actionable = val;
    if (!val) {
      this.draggable = false;
      if (state.active === this.id) state.active = null;
    }
  }

  set pos(val: Vec) {
    this._pos = val.clone();
    this.absPosBS.next(val.add(this._relVec));
    if (this._attach) this._attachVec = this.absPos.getVecFrom(this._attach.absPos);
    this.update();
  }

  style(style: Partial<Style>): void;
  style<T extends keyof Style>(prop: T, val: Style[T]): void;
  style<T extends keyof Style>(prop: T | Partial<Style>, val?: Style[T]) {
    if (typeof prop === 'string') {
      this._style[prop] = val;
      this.styleChanged([prop]);
    } else {
      Object.assign(this._style, prop);
      this.styleChanged(<T[]>Object.keys(prop));
    }
  }

  destory() {
    !!this._attachSub && this._attachSub.unsubscribe();
    !!this._attachDestroySub && this._attachDestroySub.unsubscribe();
    this._dragSubs.unsubscribe();

    for (let sub of this._subscriptions)
      sub.unsubscribe();

    this.destroyBS.next();
  }

  /**
   * Mousemove event handler
   * @param e MouseEvent
   */
  mousemoveHandler(e: MouseEvent): boolean {
    if (!e || !this._actionable || (state.active && state.active !== this.id)) return false;
    if (this.isPointIn(new Vec(e.offsetX, e.offsetY))) {
      if (!this._mousein) {
        this._mousein = true;
        this.mouseinBS.next(e);
      }
    } else if (this._mousein) {
      this._mousein = false;
      this.mouseoutBS.next(e);
    }

    if (this._dragStart) {
      this._drag = true;
      this.dragBS.next(e);
      return true;
    }

    return false;
  }

  /**
   * Mousedown event handler
   * @param e MouseEvent
   */
  mousedownHandler(e: MouseEvent): boolean {
    if (!e || !this._actionable || (state.active && state.active !== this.id)) return false;
    if (this._mousein) {
      state.active = this.id;
      this._dragStart = true;
      this.dragstartBS.next(e);
      return true;
    }

    return false;
  }

  /**
   * Mouseup event handler
   * @param e MouseEvent
   */
  mouseupHandler(e: MouseEvent) {
    if (!e || !this._actionable || (state.active && state.active !== this.id)) return false;
    if (this._dragStart) {
      state.active = null;
      if (this.drag) {
        this._dragStart = this._drag = false;
        this.dragendBS.next(e);
      } else {
        this._dragStart = false;
        this.clickBS.next(e);
      }

      return true;
    }

    return false;
  }

  relate(shape: Shape) {
    this.deattach();
    this._rel = shape;
    this._relVec = shape.absPos;
    this._relDestroySub = shape.destroy$.subscribe(() => this.unrelate());
    this._relSub = shape.absPos$.subscribe(relVec => {
      this._relVec = relVec;
      this.absPosBS.next(this._relVec.add(this._pos));
      this.update();
    });
  }

  unrelate() {
    this._rel = null
    this._relVec = new Vec(0, 0);
    !!this._relSub && this._relSub.unsubscribe();
    !!this._relDestroySub && this._relDestroySub.unsubscribe();
    this.update();
  }

  attach(shape: Shape) {
    if (this._rel) return;
    this.unrelate();
    this._attach = shape;
    this._attachVec = this.absPos.getVecFrom(shape.absPos);
    this._attachDestroySub = shape.destroy$.subscribe(() => this.deattach());
    this._attachSub = shape.absPos$.subscribe(() => {
      this.absPosBS.next(this._attach.absPos.add(this._attachVec));
      this._pos = this.absPos.add(this._relVec.opposite());
      this.update();
    });
  }

  deattach() {
    this._attach = null;
    this._attachVec = null;
    !!this._attachSub && this._attachSub.unsubscribe();
    !!this._attachDestroySub && this._attachDestroySub.unsubscribe();
    this.update();
  }

  clip(shape: Shape) {
    this._clip = shape;
  }

  unClip() {
    this._clip = null;
  }
}