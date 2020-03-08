import { Vec } from "./geometery/measure";

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

export interface State {
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  translate: Vec;
  scale: number;
  panMode: boolean;
  zoomMode: boolean;
  active: string;
  style: Style
}

export const state: State = {
  canvas: null,
  ctx: null,
  translate: null,
  scale: 1,
  panMode: false,
  zoomMode: false,
  active: null,
  style: {
    fill: '#FF5566',
    strokeStyle: '#222222',
    lineWidth: 2,
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
  }
}