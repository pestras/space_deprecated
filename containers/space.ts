import { Layer } from './layer';
import { Style } from '../space.interface';
import { Vec, Size } from '../geometery/measure';

export type FrameRate = 60 | 30 | 20 | 10 | 6 | 5 | 4 | 3 | 2 | 1;

export interface SpaceOptions {
  axis?: boolean;
  bgc?: string;
  frameRate?: FrameRate;
}

let lastFrameTime: number;

export class Space {
  protected _canvas: HTMLCanvasElement;
  protected _ctx: CanvasRenderingContext2D;
  protected _translate: Vec;
  protected _scale: number;
  protected _active: string;
  protected _layers: Layer[] = [];
  protected _fixedLayers: Layer[] = [];
  protected _animationHandle: number;
  protected _mousedown: Vec = null;
  protected _viewMousedown: Vec = null;
  protected _mousedownDir: Vec = null;
  protected _panning = false;
  protected _center: Vec;
  protected _viewCenter: Vec;
  protected _size: Size;
  protected _viewSize: Size;
  protected _style: Style = {
    fill: '#FF5566',
    strokeStyle: '#222222',
    lineWidth: 0,
    lineJoin: "round",
    lineCap: "round",
    fontSize: 16,
    fontFamily: 'Arial',
    fontColor: '#555555',
    lineGap: 5,
    textOverflow: 'nowrap',
    radius: 0,
    textAlign: 'left',
    textBaseline: 'alphabetic',
    shadow: null,
    alfa: 1,
    lineDash: []
  };
  readonly options: SpaceOptions = {
    axis: true,
    bgc: '#F6F6F6',
    frameRate: 30
  }

  constructor(canvasId: string, options: SpaceOptions = {}, style: Style = {}) {
    Object.assign(this.options, options);
    Object.assign(this._style, style);
    this._canvas = <HTMLCanvasElement>document.getElementById(canvasId);
    if (!this._canvas) return;
    this._ctx = this._canvas.getContext('2d');
    this._canvas.style.width = this._canvas.style.height = "100%";
    this._scale = 1;
    this.options.frameRate = options.frameRate || 30;
    this.resize();
    this.init();
  }
  
  get center() { return this._center.clone(); }
  get viewCenter() { return this._viewCenter.clone(); }
  get size() { return this._size.clone(); }
  get viewSize() { return this._viewSize.clone(); }
  get canvas() { return this._canvas; }
  get ctx() { return this._ctx; }
  get scale() { return this._scale; }
  get translate() { return this._translate.clone(); }
  get style() { return Object.assign({}, this._style); }
  get active() { return this._active; }
  set active(val: string) { this._active = val; }

  addLayers(...layers: Layer[]) {
    for (let layer of layers) {
      if (layer.fixed) {
        if (this._fixedLayers.indexOf(layer) === -1) this._fixedLayers.push(layer);
      } else {
        if (this._layers.indexOf(layer) === -1) this._layers.push(layer);
      }
    }
    this.draw();
  }

  removeLayers(...layers: Layer[]) {
    for (let layer of layers) {
      if (layer.fixed) {
        let index = this._fixedLayers.indexOf(layer);
        if (index > -1) {
          layer.destroy();
          this._fixedLayers.splice(index, 1);
        }

      } else {
        let index = this._layers.indexOf(layer);
        if (index > -1) {
          layer.destroy();
          this._layers.splice(index, 1);
        }
      }
    }
    this.draw();
  }

  forward(layer: Layer) {
    if (layer.fixed) {
      let index = this._fixedLayers.indexOf(layer);
      if (index > -1 && index < this._fixedLayers.length - 1) this._layers.splice(index, 2, this._layers[index + 1], this._layers[index]);

    } else {
      let index = this._layers.indexOf(layer);
      if (index > -1 && index < this._layers.length - 1) this._layers.splice(index, 2, this._layers[index + 1], this._layers[index]);
    }
    this.draw();
  }

  tofront(layer: Layer) {
    if (layer.fixed) {
      let index = this._fixedLayers.indexOf(layer);
      if (index > -1 && index < this._fixedLayers.length - 1) {
        this._fixedLayers.splice(index, 1);
        this._fixedLayers.push(layer);
      }

    } else {
      let index = this._layers.indexOf(layer);
      if (index > -1 && index < this._layers.length - 1) {
        this._layers.splice(index, 1);
        this._layers.push(layer);
      }
    }
    this.draw();
  }

  backward(layer: Layer) {
    if (layer.fixed) {
      let index = this._fixedLayers.indexOf(layer);
      if (index > 0) this._fixedLayers.splice(index - 1, 2, this._fixedLayers[index], this._fixedLayers[index - 1]);

    } else {
      let index = this._layers.indexOf(layer);
      if (index > 0) this._layers.splice(index - 1, 2, this._layers[index], this._layers[index - 1]);
    }
    this.draw();
  }

  toback(layer: Layer) {
    if (layer.fixed) {
      let index = this._fixedLayers.indexOf(layer);
      if (index > 0) {
        this._fixedLayers.splice(index, 1);
        this._fixedLayers.unshift(layer);
      }

    } else {
      let index = this._layers.indexOf(layer);
      if (index > 0) {
        this._layers.splice(index, 1);
        this._layers.unshift(layer);
      }
    }
    this.draw();
  }

  private resize() {
    let clientRect = this._canvas.getBoundingClientRect();
    this._canvas.width = clientRect.width;
    this._canvas.height = clientRect.height;
    this._size = new Size(clientRect.width, clientRect.height);
    this._viewSize = this._size.divide(this._scale);
    this._center = new Vec(0, 0).center(this._size);
    this._translate = this._center;
    this._viewCenter = this._translate.center(this._viewSize);
    this.draw();
  }

  private triggerEvent(event: string, e: MouseEvent) {
    if (event === 'mouseup' && this._panning) return this._panning = false;

    for (let i = this._fixedLayers.length - 1; i > -1; i--)
      if (this._fixedLayers[i].onEvent(event, e)) return this.draw();
    for (let i = this._layers.length - 1; i > -1; i--)
      if (this._layers[i].onEvent(event, e)) return this.draw();

    if (event === 'mousedown') this._panning = true;
    this.draw();
  }

  private init() {
    this._canvas.addEventListener('mousemove', e => {
      if (this._panning && this._mousedown) {
        this._translate = this._translate.add(e.movementX, e.movementY);
        this._viewCenter = this._translate.center(this._viewSize);

        this.draw();

      } else {
        this.triggerEvent('mousemove', e);
      }
    });

    this._canvas.addEventListener('mousedown', e => {
      this._mousedown = new Vec(e.offsetX, e.offsetY);
      this._viewMousedown = this._mousedown.divide(this._scale).getVecFrom(this._translate.divide(this._scale));
      this._mousedownDir = this._translate.getVecFrom(this._viewMousedown);
      this.triggerEvent('mousedown', e);
    });

    this._canvas.addEventListener('mouseup', e => {
      this.triggerEvent('mouseup', e);
      this._mousedown = null;
      this._mousedownDir = null;
    });

    this._canvas.addEventListener('mousewheel', (e: any) => {
      e.preventDefault();
      let scale = this._scale + (Math.ceil(e.wheelDeltaY / 10) * 0.01);
      this._scale = scale <= 0.1 ? 0.1 : (scale >= 5 ? 5 : scale);
      this._viewSize = this._size.divide(this._scale);
      this._viewCenter = this._translate.center(this._viewSize);
      this.draw();
      return false;
    }, false);

    window.addEventListener('resize', () => {
      this.resize();
    });

    this.draw();
  }

  protected drawAxis() {
    this._ctx.save();
    this._ctx.beginPath();
    this._ctx.fillStyle = 'transparent';
    this._ctx.strokeStyle = "#EEEEEE";
    this._ctx.lineWidth = 1 / this._scale;
    this._ctx.moveTo(-100000, 0);
    this._ctx.lineTo(100000, 0);
    this._ctx.closePath();
    this._ctx.stroke();
    this._ctx.strokeStyle = "#EEEEEE";
    this._ctx.moveTo(0, -100000);
    this._ctx.lineTo(0, 100000);
    this._ctx.closePath();
    this._ctx.stroke();
    this._ctx.lineWidth = 0;
    this._ctx.fillStyle = '#CCCCCC';
    this._ctx.arc(0, 0, 2 / this._scale, 0, 2 * Math.PI);
    this._ctx.closePath();
    this._ctx.fill();
    this._ctx.restore();
  }

  private ignoreFrame() {
    let now = Date.now();
    if (lastFrameTime && (now - lastFrameTime < 1000/this.options.frameRate)) return true;
    lastFrameTime = now;
  }

  draw() {
    if (this.ignoreFrame()) return;
    this._ctx.beginPath()
    this._ctx.rect(0, 0, this._size.w, this._size.h);
    this._ctx.fillStyle = this.options.bgc;
    this._ctx.fill();
    this._ctx.fillStyle = this._style.fill;

    this._ctx.save();
    this._ctx.translate(this._translate.x, this._translate.y);
    this._ctx.scale(this._scale, this._scale);

    if (this.options.axis) this.drawAxis();
    for (let layer of this._layers) layer.draw();
    this._ctx.restore();
    for (let layer of this._fixedLayers) layer.draw();
  }

  zoom(amount?: number) {
    if (amount === undefined) return this._scale;
    let scale = this._scale + amount;
    this._scale = scale < 0.1 ? 0.1 : scale > 5 ? 5 : scale;
    this.draw();
  }

  resetTransform() {
    this._ctx.transform(1, 0, 0, 1, 0, 0);
    this._translate = this._center;
    this._scale = 1;
    this.draw();
  }

  clear(stopRender = true, resetTransform = true) {
    for (let layer of this._layers) layer.destroy();
    this._layers = [];
    for (let layer of this._fixedLayers) layer.destroy();
    this._fixedLayers = [];
    resetTransform && this.resetTransform();
    if (!this._animationHandle || !stopRender) return;
    window.cancelAnimationFrame(this._animationHandle);
    this._animationHandle = null;
    lastFrameTime = 0;
    this.draw();
  }

  origin(pos?: Vec) {
    if (!pos) return this._translate.clone();

    this._ctx.transform(1, 0, 0, 1, 0, 0);
    this._translate = pos.clone();
    this.draw();
  }
}