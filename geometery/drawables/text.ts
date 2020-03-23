import { Shape } from '../shape';
import { Vec, Size, FlexSize } from '../measure';
import { ISpace, Style } from '../../space.interface';

export class TextBox extends Shape {
  protected _content: string;
  protected _flexSize: FlexSize;
  protected _lines: string[];
  protected _lineHeight: number;

  constructor(
    space: ISpace,
    content: string,
    position: Vec,
    size: FlexSize
  ) {
    super(space);
    this._content = content;
    this._flexSize = size.clone();
    if (size.h === 'auto') this._style.textOverflow = 'wrap';
    this._lineHeight = this._style.fontSize + this._style.lineGap;
    this.pos = position;
  }

  protected update() {
    this._lines = this.prepareContent();
    let size = new Size(
      this._flexSize.w === 'auto' ? this.space.ctx.measureText(this._lines[0]).width : this._flexSize.w,
      this._flexSize.h === 'auto' ? this._lineHeight * this._lines.length : this._flexSize.h
    );

    if (!this.size || !this.size.equals(size)) this.sizeBS.next(size);
    
    this._corners = [
      this.absPos,
      this.absPos.add(this.size.w, 0),
      this.absPos.add(this.size.w, this.size.h),
      this.absPos.add(0, this.size.h)
    ];
  }

  protected styleChanged(props: (keyof Style)[]) {
    if (props.indexOf('fontSize') > -1 || props.indexOf('lineCap') > -1) {
      this._lineHeight = this._style.fontSize + this._style.lineGap;
      this.update();
    }
  }

  protected getMaxLineChars(str: string, minus = 0) {
    let chars = str.split('');
    let line = '';
    let index = 0;

    for (let char of chars) {
      if (this.space.ctx.measureText(line + char).width / 0.65 > <number>this._flexSize.w - minus) break;

      line += char;
      index++;
    }

    return { line, rest: chars.slice(index).join('') };
  }

  protected getMaxlineWords(str: string) {
    let words = str.split(' ');
    let line = '';
    let index = 0;

    for (let word of words) {
      if ((this.space.ctx.measureText(line + (!!index ? ' ' : '') + word).width) / 0.65 > <number>this._flexSize.w) break;

      line += (!!index ? ' ' : '') + word;
      index++;
    }

    return { line, rest: words.slice(index).join(' ') };
  }

  protected prepareContent(): string[] {
    if (this._style.textOverflow === 'nowrap' || this._flexSize.w === 'auto')
      return [this._content];

    let lines = this._content.split('\n');

    if (this._style.textOverflow === 'truncate') {
      let currLine = this._content;
      let result = this.getMaxLineChars(currLine, 15 * this._style.fontSize / 16);

      if (result.rest.length > 0)
        result.line = result.line.trim() + '...';

      return [result.line];
    }

    let result: string[] = [];
    let currLine = lines.shift();

    while (currLine) {
      let currResult = this.getMaxlineWords(currLine);
      result.push(currResult.line);

      if (this._flexSize.h !== 'auto' && (result.length + 1) * this._lineHeight > this._flexSize.h)
        currLine = null;
      else if (currResult.rest.length > 0)
        currLine = currResult.rest;
      else
        currLine = lines.shift();
    }

    return result;
  }

  get content() { return this._content; }
  set content(val: string) {
    this._content = val;
    this.update();
  }

  setSize(val: FlexSize) {
    this._flexSize = val.clone();
    this.update();
  }

  make() {
    console.warn('Generating clip from text is not supported until this moment');
  }

  draw() {
    if (!this.visible) return;
    
    this.space.ctx.save();

    if (this._clip) this._clip.makeClip();
    
    this.space.ctx.beginPath();

    this.space.ctx.font = `${this._style.fontSize}px ${this._style.fontFamily}`;
    this.space.ctx.textAlign = this._style.textAlign;
    this.space.ctx.textBaseline = this._style.textBaseline;

    if (this._style.shadow) {
      this.space.ctx.shadowOffsetX = this._style.shadow[0];
      this.space.ctx.shadowOffsetY = this._style.shadow[1];
      this.space.ctx.shadowBlur = this._style.shadow[2];
      this.space.ctx.shadowColor = this._style.shadow[3];
    }

    if (this._style.fontColor) {
      this.space.ctx.fillStyle = this._style.fontColor;
    
      for (let i = 0; i < this._lines.length; i++) {
        let y = this._corners[0].y + this._lineHeight * (i + 1);
        this.space.ctx.fillText(this._lines[i], this._corners[0].x, y);
      }
    }

    if (this._style.strokeStyle && this._style.lineWidth > 0) {
      this.space.ctx.strokeStyle = this._style.strokeStyle;
      this.space.ctx.lineWidth = this._style.lineWidth;
      this.space.ctx.lineCap = this._style.lineCap;
      this.space.ctx.lineJoin = this._style.lineJoin;      
      !!this._style.lineDash && this.space.ctx.setLineDash(this._style.lineDash);

      for (let i = 0; i < this._lines.length; i++) {
        let y = this._corners[0].y + this._lineHeight * (i + 1);
        this.space.ctx.strokeText(this._lines[i], this._corners[0].x, y, this.size.w);
      }
    }

    this.space.ctx.restore();
    this.space.ctx.save();
    this.space.ctx.beginPath();
    
    this._path.rect(this.absPos.x, this.absPos.y, this.size.w, this.size.h);
    this.space.ctx.fillStyle = "transparent";
    this.space.ctx.fill(this._path);
    this.space.ctx.restore();
  }
}