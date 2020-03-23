import { Vec } from './geometery/measure';

export interface Style {
  fill?: string;
  strokeStyle?: string;
  lineWidth?: number;
  lineJoin?: "miter" | "round" | "bevel";
  lineCap?: "butt" | "round" | "square";
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  lineGap?: number;
  textOverflow?: 'nowrap' | 'wrap' | 'truncate';
  radius?: number;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  shadow?: [number, number, number, string];
  alfa?: number;
  lineDash?: number[];
}

export interface ISpace {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  translate: Vec;
  scale: number;
  active: string;
  style: Style;
}