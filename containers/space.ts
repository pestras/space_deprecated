import { Layer } from './layer';
import { state, Style } from '../state';
import { Vec } from '../geometery/measure';
import { MouseCoords } from '../geometery/mouse-point';

export interface SpaceOptions {
  axis?: boolean;
  bgc?: string;
}

export class Space {
  protected layers: Layer[] = [];
  protected fixedLayers: Layer[] = [];
  protected animationHandle: number;
  protected mousedown: Vec = null;
  protected ctrlBtnPress = false;
  protected shftBtnPress = false;
  protected center: Vec;
  readonly options: SpaceOptions = {
    axis: true,
    bgc: '#F6F6F6'
  }

  constructor(canvasId: string, options: SpaceOptions = {}, style: Style = {}) {
    Object.assign(this.options, options);
    Object.assign(state.style, style);
    state.canvas = <HTMLCanvasElement>document.getElementById(canvasId);
    if (!state.canvas) return;
    state.ctx = state.canvas.getContext('2d');
    state.canvas.style.width = state.canvas.style.height = "100%";
    this.center = new Vec(state.canvas.clientWidth / 2, state.canvas.clientHeight / 2);
    state.translate = this.center;
    this.resize();
    this.init();
  }

  private resize() {
    let clientRect = state.canvas.getBoundingClientRect();
    state.canvas.width = clientRect.width;
    state.canvas.height = clientRect.height;
  }

  private triggerEvent(event: string, e: MouseEvent) {
    for (let i = this.fixedLayers.length - 1; i > -1; i--)
      if (this.fixedLayers[i].onEvent(event, e)) return;
    for (let i = this.layers.length - 1; i > -1; i--)
      if (this.layers[i].onEvent(event, e)) return;
  }

  private init() {
    state.canvas.addEventListener('mousemove', e => {
      if (state.panMode && this.mousedown) {
        state.translate = state.translate.add(e.movementX, e.movementY);

      } else if (state.zoomMode && this.mousedown) {
        let newScale = state.scale - (0.005 * e.movementY);
        state.scale = newScale <= 0.1 ? 0.1 : (newScale >= 5 ? 5 : newScale);
      } else {
        this.triggerEvent('mousemove', e);
      }
    });
    state.canvas.addEventListener('mousedown', e => {
      this.mousedown = new MouseCoords(e.offsetX, e.offsetY);
      if (!state.panMode && !state.zoomMode) this.triggerEvent('mousedown', e);
    });
    state.canvas.addEventListener('mouseup', e => {
      this.mousedown = null;
      if (!state.panMode && !state.zoomMode) this.triggerEvent('mouseup', e);
    });

    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  get rendering() { return !!this.animationHandle; }
  get panMode() { return state.panMode; }
  set panMode(val: boolean) {
    state.panMode = val;
    if (val) state.zoomMode = false;
  }
  get zoomMode() { return state.zoomMode; }
  set zoomMode(val: boolean) { 
    state.zoomMode = val;
    if (val) state.panMode = false;
  }

  addLayers(...layers: Layer[]) {
    for (let layer of layers) {
      if (layer.fixed) {
        if (this.fixedLayers.indexOf(layer) === -1) this.fixedLayers.push(layer);
      } else {
        if (this.layers.indexOf(layer) === -1) this.layers.push(layer);
      }
    }
  }

  removeLayers(...layers: Layer[]) {
    for (let layer of layers) {
      if (layer.fixed) {
        let index = this.fixedLayers.indexOf(layer);
        if (index > -1) {
          layer.destroy();
          this.fixedLayers.splice(index, 1);
        }
  
      } else {
        let index = this.layers.indexOf(layer);
        if (index > -1) {
          layer.destroy();
          this.layers.splice(index, 1);
        }
      }
    }
  }

  clear() {
    for (let layer of this.layers) layer.destroy();
    this.layers = [];
    for (let layer of this.fixedLayers) layer.destroy();
    this.fixedLayers = [];
  }

  forward(layer: Layer) {
    if (layer.fixed) {
      let index = this.fixedLayers.indexOf(layer);
      if (index > -1 && index < this.fixedLayers.length - 1) this.layers.splice(index, 2, this.layers[index + 1], this.layers[index]);

    } else {
      let index = this.layers.indexOf(layer);
      if (index > -1 && index < this.layers.length - 1) this.layers.splice(index, 2, this.layers[index + 1], this.layers[index]);
    }

  }

  tofront(layer: Layer) {
    if (layer.fixed) {
      let index = this.fixedLayers.indexOf(layer);
      if (index > -1 && index < this.fixedLayers.length - 1) {
        this.fixedLayers.splice(index, 1);
        this.fixedLayers.push(layer);
      }

    } else {
      let index = this.layers.indexOf(layer);
      if (index > -1 && index < this.layers.length - 1) {
        this.layers.splice(index, 1);
        this.layers.push(layer);
      }
    }
  }

  backward(layer: Layer) {
    if (layer.fixed) {
      let index = this.fixedLayers.indexOf(layer);
      if (index > 0) this.fixedLayers.splice(index - 1, 2, this.fixedLayers[index], this.fixedLayers[index - 1]);

    } else {
      let index = this.layers.indexOf(layer);
      if (index > 0) this.layers.splice(index - 1, 2, this.layers[index], this.layers[index - 1]);
    }
  }

  toback(layer: Layer) {
    if (layer.fixed) {
      let index = this.fixedLayers.indexOf(layer);
      if (index > 0) {
        this.fixedLayers.splice(index, 1);
        this.fixedLayers.unshift(layer);
      }

    } else {
      let index = this.layers.indexOf(layer);
      if (index > 0) {
        this.layers.splice(index, 1);
        this.layers.unshift(layer);
      }
    }    
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
    state.ctx.rect(-100000, -100000, 200000, 200000);
    state.ctx.fillStyle = this.options.bgc;
    state.ctx.fill();
    state.ctx.fillStyle = state.style.fill;

    state.ctx.save();
    state.ctx.translate(state.translate.x, state.translate.y);
    state.ctx.scale(state.scale, state.scale);
    if (this.options.axis) this.drawAxis();
    for (let layer of this.layers) layer.draw();
    state.ctx.restore();
    for (let layer of this.fixedLayers) layer.draw();
  }

  protected draw(tick: number) {
    this.frame();
    this.animationHandle = window.requestAnimationFrame(tick => this.draw(tick));
  }

  render() {
    if (!!this.animationHandle) return;
    this.animationHandle = window.requestAnimationFrame(tick => this.draw(tick));
  }

  stopRender() {
    window.cancelAnimationFrame(this.animationHandle);
    this.animationHandle = null;
  }

  resetTransform() {
    state.ctx.transform(1, 0, 0, 1, 0, 0);
    state.translate = this.center;
    state.scale = 1;
  }

  zoom(): void
  zoom(out: boolean): void
  zoom(amount: number): void
  zoom(amount: number, out: boolean): void
  zoom(amount: number | boolean = false, out = false) {
    if (amount === undefined) return state.scale;

    if (typeof amount === 'boolean') {
      out = amount;
      amount = 0.1;
    }

    let scale = state.scale + (out ? -amount : amount);
    state.scale = scale < 0.1 ? 0.1 : scale > 5 ? 5 : scale;
  }

  origin(pos?: Vec) {
    if (!pos) return state.translate.clone();
    
    state.ctx.transform(1, 0, 0, 1, 0, 0);
    state.translate = pos.clone();
  }
}