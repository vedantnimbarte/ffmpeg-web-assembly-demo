import {
  FPS,
  MIMETYPES,
  RECORDING_DURATION_IN_MS,
  RESOLUTION,
} from "./constants";
import RecordRTC from "recordrtc";

export function renderTextWithEl(text, element) {
  const container = document.createElement("div");
  const textEl = document.createElement("p");
  const divider = document.createElement("hr");
  textEl.innerText = text;
  container.appendChild(textEl);
  container.appendChild(element);
  container.appendChild(divider);
  document.body.appendChild(container);
  return;
}

export const captureSvgAnimationVideo = async (svgImg, canvas) => {
  const ctx = canvas.getContext("2d");
  let animationRequestId;

  const stream = canvas.captureStream(FPS);
  const recorder = new RecordRTC(stream, {
    type: "video",
    mimeType: MIMETYPES.webm,
    frameRate: FPS,
    video: { width: RESOLUTION.width, height: RESOLUTION.height },
    disableLogs: true,
  });
  recorder.startRecording();

  canvas.height = RESOLUTION.height;
  canvas.width = RESOLUTION.width;

  return new Promise(async (resolve) => {
    function drawFrame(_timestamp) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(svgImg, 0, 0);
      animationRequestId = requestAnimationFrame(drawFrame);
    }
    animationRequestId = requestAnimationFrame(drawFrame);

    setTimeout(() => {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        const url = URL.createObjectURL(blob);
        cancelAnimationFrame(animationRequestId);
        resolve(url);
      });
    }, RECORDING_DURATION_IN_MS);
  });
};

export async function loadSVG(svgDataUrl) {
  const response = await fetch(svgDataUrl);
  const svgText = await response.text();
  const blob = new Blob([svgText], { type: MIMETYPES.svg });

  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = (e) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.height = 1000;
      img.width = 1000;
      img.onload = () => {
        resolve(img);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.readAsDataURL(blob);
  });
}

export async function convertSvgToVideo(svgDataUrl) {
  const canvas = document.createElement("canvas");
  const svgImg = await loadSVG(svgDataUrl);
  renderTextWithEl("Preview of SVG", svgImg);
  const videoUrl = await captureSvgAnimationVideo(svgImg, canvas);
  return videoUrl;
}

export function downloadGIF(output) {
  var link = document.createElement("a");
  link.href = output;
  link.download = "Download.gif";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
