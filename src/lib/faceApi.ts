import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://vladmandic.github.io/face-api/model";

let loadingPromise: Promise<void> | null = null;

export async function loadFaceModels(): Promise<void> {
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  })();
  return loadingPromise;
}

export const detectorOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 416,
  scoreThreshold: 0.5,
});

export async function detectSingleFace(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
  return faceapi
    .detectSingleFace(input, detectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptor();
}

export async function detectAllFaces(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
  return faceapi
    .detectAllFaces(input, detectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptors();
}

export function euclideanDistance(a: Float32Array | number[], b: Float32Array | number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] as number) - (b[i] as number);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export { faceapi };
