import { Shape } from '../shape';
import { Vec, Angle } from '../measure';
import { state } from '../../state';

export type Rel = 'r' | 'a' | 's';
export type LineBlock = ['l', [Rel, Vec]];
export type ArcBlock = ['a', [Rel, Vec], number, Angle, Angle, boolean?];
export type ArcToBlock = ['t', [Rel, Vec], [Rel, Vec], number];
export type CurveBlock = ['c', [Rel, Vec], [Rel, Vec], [Rel, Vec]?];
export type PathBlocks = (LineBlock | ArcBlock | ArcToBlock | CurveBlock)[];

export class Path extends Shape {
  protected _blocks: PathBlocks;
  close = false;

  constructor(position: Vec, ...blocks: PathBlocks) {
    super();

    this._blocks = blocks || [];
    this.pos = position;
  }

  protected update() {
  }

  make() {
    state.ctx.beginPath();
    this._path.moveTo(this.absPos.x, this.absPos.y);
    let lastVec = this.pos;
    let to: Vec;
    let c1: Vec;
    let c2: Vec;
    
    for (let block of this._blocks) {
      switch (block[0]) {
        case 'l':
          to = block[1][0] === 'r' ? lastVec.add(block[1][1]) : block[1][0] === 's' ? this.pos.add(block[1][1]) : block[1][1];
          this._path.lineTo(to.x, to.y);
          lastVec = to;
          break;
        case 'a':
          to = block[1][0] === 'r' ? lastVec.add(block[1][1]) : block[1][0] === 's' ? this.pos.add(block[1][1]) : block[1][1];
          this._path.arc(to.x, to.y, block[2], block[3].r, block[4].r, !!block[5]);
          lastVec = to;
          break;
        case 't':
          to = block[1][0] === 'r' ? lastVec.add(block[1][1]) : block[1][0] === 's' ? this.pos.add(block[1][1]) : block[1][1];
          c1 = block[2][0] === 'r' ? lastVec.add(block[2][1]) : block[2][0] === 's' ? this.pos.add(block[2][1]) : block[2][1];
          this._path.arcTo(c1.x, c1.y, to.x, to.y, block[3]);
          lastVec = to;
          break;
        case 'c':
          to = block[1][0] === 'r' ? lastVec.add(block[1][1]) : block[1][0] === 's' ? this.pos.add(block[1][1]) : block[1][1];
          c1 = block[2][0] === 'r' ? lastVec.add(block[2][1]) : block[2][0] === 's' ? this.pos.add(block[2][1]) : block[2][1];
          if (block[3]) {
            c2 = block[3][0] === 'r' ? lastVec.add(block[3][1]) : block[3][0] === 's' ? this.pos.add(block[3][1]) : block[3][1];
            this._path.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, to.x, to.y);
          } else {
            this._path.quadraticCurveTo(c1.x, c1.y, to.x, to.y);
          }
          lastVec = to;
          break;
      }
    }

    if (this.close) this._path.closePath();
  }
}