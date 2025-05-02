
declare module 'face-api.js' {
  import * as tf from '@tensorflow/tfjs';
  
  export namespace draw {
    function drawDetections(
      canvasOrContext: HTMLCanvasElement | CanvasRenderingContext2D,
      detections: FaceDetection | WithFaceDetection<{}>
    ): void;
    
    function drawFaceLandmarks(
      canvasOrContext: HTMLCanvasElement | CanvasRenderingContext2D,
      faceLandmarks: FaceLandmarks | WithFaceLandmarks<{}>
    ): void;
  }

  export class TinyFaceDetectorOptions {
    constructor(options?: { inputSize?: number; scoreThreshold?: number });
    public inputSize: number;
    public scoreThreshold: number;
  }

  export class FaceLandmarks {
    public positions: Point[];
    public shift(point: Point): FaceLandmarks;
    public getLeftEye(): Point[];
    public getRightEye(): Point[];
    public getNose(): Point[];
    public getMouth(): Point[];
    public getJawOutline(): Point[];
  }

  export type FaceDetection = {
    score: number;
    box: Box;
  }

  export interface WithFaceDetection<T> {
    detection: FaceDetection;
  }

  export interface WithFaceLandmarks<T extends WithFaceDetection<{}>> {
    landmarks: FaceLandmarks;
    detection: FaceDetection;
    aligned?: any;
  }

  export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface Point {
    x: number;
    y: number;
  }

  export interface Dimensions {
    width: number;
    height: number;
  }

  export function matchDimensions(canvas: HTMLCanvasElement, dimensions: Dimensions): void;
  export function resizeResults<T>(results: T, dimensions: Dimensions): T;
  export function createCanvas(dimensions: Dimensions): HTMLCanvasElement;
  export function createCanvasFromMedia(media: HTMLImageElement | HTMLVideoElement): HTMLCanvasElement;
  export function detectAllFaces(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, options?: TinyFaceDetectorOptions): Promise<WithFaceDetection<{}>[]>;
  export function detectSingleFace(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, options?: TinyFaceDetectorOptions): Promise<WithFaceDetection<{}> | undefined>;
  
  export namespace nets {
    const tinyFaceDetector: {
      loadFromUri(uri: string): Promise<void>;
      loadFromDisk(uri: string): Promise<void>;
    };
    const faceLandmark68Net: {
      loadFromUri(uri: string): Promise<void>;
      loadFromDisk(uri: string): Promise<void>;
    };
    const faceRecognitionNet: {
      loadFromUri(uri: string): Promise<void>;
      loadFromDisk(uri: string): Promise<void>;
    };
  }
}
