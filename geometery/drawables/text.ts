import { Shape } from '../shape';
import { state, Style } from '../../state';
import { Vec, Size, FlexSize } from '../measure';

export class TextBox extends Shape {
  protected _content: string;
  protected _flexSize: FlexSize;
  protected _lines: string[];
  protected _lineHeight: number;

  constructor(
    content: string,
    position: Vec,
    size: FlexSize
  ) {
    super();
    this._content = content;
    this._flexSize = size.clone();
    if (size.h === 'auto') this._style.textOverflow = 'wrap';
    this._lineHeight = this._style.fontSize + this._style.lineGap;
    this.pos = position;
  }

  protected update() {
    this._lines = this.prepareContent();
    let size = new Size(
      this._flexSize.w === 'auto' ? state.ctx.measureText(this._lines[0]).width : this._flexSize.w,
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
      if (state.ctx.measureText(line + char).width / 0.65 > <number>this._flexSize.w - minus) break;

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
      if ((state.ctx.measureText(line + (!!index ? ' ' : '') + word).width) / 0.65 > <number>this._flexSize.w) break;

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
    
    state.ctx.save();

    if (this._clip) this._clip.makeClip();
    
    state.ctx.beginPath();

    state.ctx.font = `${this._style.fontSize}px ${this._style.fontFamily}`;
    state.ctx.textAlign = this._style.textAlign;
    state.ctx.textBaseline = this._style.textBaseline;

    if (this._style.shadow) {
      state.ctx.shadowOffsetX = this._style.shadow[0];
      state.ctx.shadowOffsetY = this._style.shadow[1];
      state.ctx.shadowBlur = this._style.shadow[2];
      state.ctx.shadowColor = this._style.shadow[3];
    }

    if (this._style.fontColor) {
      state.ctx.fillStyle = this._style.fontColor;
    
      for (let i = 0; i < this._lines.length; i++) {
        let y = this._corners[0].y + this._lineHeight * (i + 1);
        state.ctx.fillText(this._lines[i], this._corners[0].x, y);
      }
    }

    if (this._style.strokeStyle && this._style.lineWidth > 0) {
      state.ctx.strokeStyle = this._style.strokeStyle;
      state.ctx.lineWidth = this._style.lineWidth;
      state.ctx.lineCap = this._style.lineCap;
      state.ctx.lineJoin = this._style.lineJoin;      
      !!this._style.lineDash && state.ctx.setLineDash(this._style.lineDash);

      for (let i = 0; i < this._lines.length; i++) {
        let y = this._corners[0].y + this._lineHeight * (i + 1);
        state.ctx.strokeText(this._lines[i], this._corners[0].x, y, this.size.w);
      }
    }

    state.ctx.restore();
    state.ctx.save();
    state.ctx.beginPath();
    
    this._path.rect(this.absPos.x, this.absPos.y, this.size.w, this.size.h);
    state.ctx.fillStyle = "transparent";
    state.ctx.fill(this._path);
    state.ctx.restore();
  }
}