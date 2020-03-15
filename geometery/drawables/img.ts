import { Shape } from '../shape';
import { Vec, Size, FlexSize } from '../measure';
import { state } from '../../state';

export type ImageMode = 'contain' | 'cover start' | 'cover center' | 'cover end';

export class Img extends Shape {
  protected _src: string;
  protected _loaded = false;
  protected _image: HTMLImageElement;
  protected _cropPos: Vec;
  protected _cropSize: Size;
  protected _mode: ImageMode;
  protected _flexSize: FlexSize;

  constructor(
    src: string,
    position: Vec,
    size?: FlexSize,
    mode?: ImageMode
  ) {
    super();
    
    this._image = new Image();
    this._image.onload = () => this.onLoad();
    this._image.src = src;
    this._flexSize = size ? size.clone() : null
    this._mode = mode || 'contain';
    this.pos = position;
    this.update();
  }

  protected update() {
    if (!this._loaded) return;
    console.log('update');
    let imgSize = new Size(this._image.width, this._image.height);
    let size: Size;
    this._cropSize = imgSize.clone();
    this._cropPos = new Vec(0, 0);
    
    if (this._flexSize) {
      if (this._flexSize.w === 'auto' && this._flexSize.h === 'auto') {
        size = imgSize.clone();
      } else if (this._flexSize.w === 'auto') {
        size = new Size((imgSize.h / imgSize.w) * <number>this._flexSize.h, <number>this._flexSize.h);
      } else if (this._flexSize.h === 'auto') {
        size = new Size((<number>this._flexSize.w, imgSize.w / imgSize.h) * <number>this._flexSize.w);
      } else {
        size = <any>this._flexSize.clone();
      }
    } else {
      size = imgSize.clone();
    }

    if (!size.equals(imgSize)) {

      if (this._mode === 'contain') {
        if (Math.abs(imgSize.w / size.w) > Math.abs(imgSize.h / size.h))
          size.h = (size.w / imgSize.w) * imgSize.h;
        else
          size.w = (size.h / imgSize.h) * imgSize.w;
  
      } else {
        if (Math.abs(imgSize.w / size.w) < Math.abs(imgSize.h / size.h)) {
          imgSize = new Size(this._image.width, (size.w / imgSize.w) * imgSize.h);
          this._cropSize.w = this._image.width;
          this._cropSize.h = (size.h / imgSize.h) * this._image.height;
  
          if (this._mode.indexOf('start') > -1) {
            this._cropPos = new Vec(0, 0);
          } else if (this._mode.indexOf('end') > -1) {
            this._cropPos = new Vec(0, this._image.height - this._cropSize.h);
          } else {
            this._cropPos = new Vec(0, (this._image.height / 2) - this._cropSize.h / 2);
          }
  
        } else {
          imgSize = new Size((size.h / imgSize.h) * imgSize.w, this._image.height);
          this._cropSize.w = (size.w / imgSize.w) * this._image.width;
          this._cropSize.h = this._image.height;
  
          if (this._mode.indexOf('start') > -1) {
            this._cropPos = new Vec(0, 0);
          } else if (this._mode.indexOf('end') > -1) {
            this._cropPos = new Vec(this._image.width - this._cropSize.w, 0);
          } else {
            this._cropPos = new Vec((this._image.width / 2) - this._cropSize.w / 2, 0);
          }
        }
      }
    }
    
    this.sizeBS.next(size);
    
    this._corners = [
      this.absPos,
      this.absPos.add(this.size.w, 0),
      this.absPos.add(this.size.w, this.size.h),
      this.absPos.add(0, this.size.h)
    ];
  }

  protected onLoad() {
    this._loaded = true;
    console.log('loaded');
    this.update();
  }

  get src() { return this._image.src; }
  set src(src: string) {
    this._loaded = false;
    this._image.src = src;
  }

  get size() { return this.sizeBS.getValue(); }
  setSize(val: FlexSize) {
    this._flexSize = val.clone();
    this.update();
  }

  set mode(mode: ImageMode) {
    this._mode = mode;
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

  draw() {
    if (!this.visible || !this._loaded) return;

    state.ctx.save();
    if (this._clip) this._clip.makeClip();
    else {
      this.make();
      state.ctx.clip(this._path);
    }
    
    state.ctx.beginPath();

    if (this._style.shadow) {
      state.ctx.shadowOffsetX = this._style.shadow[0];
      state.ctx.shadowOffsetY = this._style.shadow[1];
      state.ctx.shadowBlur = this._style.shadow[2];
      state.ctx.shadowColor = this._style.shadow[3];
    }

    state.ctx.globalAlpha = this._style.alfa;
    state.ctx.drawImage(
      this._image,
      this._cropPos.x,
      this._cropPos.y,
      this._cropSize.w,
      this._cropSize.h,
      this._corners[0].x,
      this._corners[0].y,
      this.size.w,
      this.size.h
    );

    state.ctx.fillStyle = "transparent";
    state.ctx.fill(this._path);

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
}