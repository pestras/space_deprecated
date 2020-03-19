import { Layer } from './layer';
import { state, Style } from '../state';
import { Vec, Size } from '../geometery/measure';

let framePerSecond: 60 | 30 | 20 | 10 | 6 | 5 | 4 | 3 | 2 | 1;
let frameMinTime: number;
let lastFrameTime = 0

export interface SpaceOptions {
  axis?: boolean;
  bgc?: string;
  frameRate?: 60 | 30 | 20 | 10 | 6 | 5 | 4 | 3 | 2 | 1;
}

export class Space {
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
  readonly options: SpaceOptions = {
    axis: true,
    bgc: '#F6F6F6',
    frameRate: 30
  }

  constructor(canvasId: string, options: SpaceOptions = {}, style: Style = {}) {
    Object.assign(this.options, options);
    Object.assign(state.style, style);
    state.canvas = <HTMLCanvasElement>document.getElementById(canvasId);
    if (!state.canvas) return;
    state.ctx = state.canvas.getContext('2d');
    state.canvas.style.width = state.canvas.style.height = "100%";
    framePerSecond = options.frameRate || this.options.frameRate;
    frameMinTime = (1000 / 60) * (60 / framePerSecond) - (1000 / 60) * 0.5;
    this.resize();
    this.init();
  }

  get rendering() { return !!this._animationHandle; }

  addLayers(...layers: Layer[]) {
    for (let layer of layers) {
      if (layer.fixed) {
        if (this._fixedLayers.indexOf(layer) === -1) this._fixedLayers.push(layer);
      } else {
        if (this._layers.indexOf(layer) === -1) this._layers.push(layer);
      }
    }
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
  }

  forward(layer: Layer) {
    if (layer.fixed) {
      let index = this._fixedLayers.indexOf(layer);
      if (index > -1 && index < this._fixedLayers.length - 1) this._layers.splice(index, 2, this._layers[index + 1], this._layers[index]);

    } else {
      let index = this._layers.indexOf(layer);
      if (index > -1 && index < this._layers.length - 1) this._layers.splice(index, 2, this._layers[index + 1], this._layers[index]);
    }

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
  }

  backward(layer: Layer) {
    if (layer.fixed) {
      let index = this._fixedLayers.indexOf(layer);
      if (index > 0) this._fixedLayers.splice(index - 1, 2, this._fixedLayers[index], this._fixedLayers[index - 1]);

    } else {
      let index = this._layers.indexOf(layer);
      if (index > 0) this._layers.splice(index - 1, 2, this._layers[index], this._layers[index - 1]);
    }
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
  }

  private resize() {
    let clientRect = state.canvas.getBoundingClientRect();
    state.canvas.width = clientRect.width;
    state.canvas.height = clientRect.height;
    this._size = new Size(clientRect.width, clientRect.height);
    this._viewSize = this._size.divide(state.scale);
    this._center = new Vec(0, 0).center(this._size);
    state.translate = this._center;
    this._viewCenter = state.translate.center(this._viewSize);
  }

  private triggerEvent(event: string, e: MouseEvent) {
    if (event === 'mouseup' && this._panning) return this._panning = false;

    for (let i = this._fixedLayers.length - 1; i > -1; i--)
      if (this._fixedLayers[i].onEvent(event, e)) return;
    for (let i = this._layers.length - 1; i > -1; i--)
      if (this._layers[i].onEvent(event, e)) return;

    if (event === 'mousedown') this._panning = true;
  }

  private init() {
    state.canvas.addEventListener('mousemove', e => {
      if (this._panning && this._mousedown) {
        state.translate = state.translate.add(e.movementX, e.movementY);
        this._viewCenter = state.translate.center(this._viewSize);

      } else {
        this.triggerEvent('mousemove', e);
      }
    });

    state.canvas.addEventListener('mousedown', e => {
      this._mousedown = new Vec(e.offsetX, e.offsetY);
      this._viewMousedown = this._mousedown.divide(state.scale).getVecFrom(state.translate.divide(state.scale));
      this._mousedownDir = state.translate.getVecFrom(this._viewMousedown);
      this.triggerEvent('mousedown', e);
    });

    state.canvas.addEventListener('mouseup', e => {
      this.triggerEvent('mouseup', e);
      this._mousedown = null;
      this._mousedownDir = null;
    });

    state.canvas.addEventListener('mousewheel', (e: any) => {
      let scale = state.scale + (e.wheelDeltaY * 0.01);
      state.scale = scale <= 0.1 ? 0.1 : (scale >= 5 ? 5 : scale);
      this._viewSize = this._size.divide(state.scale);
      this._viewCenter = state.translate.center(this._viewSize);
    });

    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  protected drawAxis() {
    state.ctx.save();
    state.ctx.beginPath();
    state.ctx.fillStyle = 'transparent';
    state.ctx.strokeStyle = "#EEEEEE";
    state.ctx.lineWidth = 1 / state.scale;
    state.ctx.moveTo(-100000, 0);
    state.ctx.lineTo(100000, 0);
    state.ctx.closePath();
    state.ctx.stroke();
    state.ctx.strokeStyle = "#EEEEEE";
    state.ctx.moveTo(0, -100000);
    state.ctx.lineTo(0, 100000);
    state.ctx.closePath();
    state.ctx.stroke();
    state.ctx.lineWidth = 0;
    state.ctx.fillStyle = '#CCCCCC';
    state.ctx.arc(0, 0, 2 / state.scale, 0, 2 * Math.PI);
    state.ctx.closePath();
    state.ctx.fill();
    state.ctx.restore();
  }

  frame() {
    state.ctx.beginPath()
    state.ctx.rect(0, 0, this._size.w, this._size.h);
    state.ctx.fillStyle = this.options.bgc;
    state.ctx.fill();
    state.ctx.fillStyle = state.style.fill;

    state.ctx.save();
    state.ctx.translate(state.translate.x, state.translate.y);
    state.ctx.scale(state.scale, state.scale);

    if (this.options.axis) this.drawAxis();
    for (let layer of this._layers) layer.draw();
    state.ctx.restore();
    for (let layer of this._fixedLayers) layer.draw();
  }

  protected draw(time: number) {
    if (time - lastFrameTime < frameMinTime) {
      window.requestAnimationFrame(time => this.draw(time));
      return;
    }
    lastFrameTime = time;
    this.frame();
    this._animationHandle = window.requestAnimationFrame(time => this.draw(time));
  }

  render() {
    if (!!this._animationHandle) return;
    this._animationHandle = window.requestAnimationFrame(time => this.draw(time));
  }

  pause() {
    window.cancelAnimationFrame(this._animationHandle);
    this._animationHandle = null;
  }

  resetTransform() {
    state.ctx.transform(1, 0, 0, 1, 0, 0);
    state.translate = this._center;
    state.scale = 1;
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
    this.frame();
  }

  origin(pos?: Vec) {
    if (!pos) return state.translate.clone();

    state.ctx.transform(1, 0, 0, 1, 0, 0);
    state.translate = pos.clone();
  }
}