import { fetchFile } from "@ffmpeg/util";
import { DURATION, FPS, MIMETYPES, RESOLUTION } from "./constants";
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

export const captureAnimationFrames = async (svgImg, canvas) => {
  const frames = [];
  const ctx = canvas.getContext("2d");
  const totalFrames = DURATION * FPS;
  const interval = 1000 / FPS;
  let lastFrameTime = performance.now();

  console.log("[TOTAL FRAMES]", totalFrames);

  canvas.height = RESOLUTION.height;
  canvas.width = RESOLUTION.width;

  return new Promise(async (resolve) => {
    let frameCount = 0;
    function drawFrame(timestamp) {
      if (timestamp - lastFrameTime >= interval) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(svgImg, 0, 0);

        canvas.toBlob(async (blob) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            frames.push(e.target.result);
          };
          reader.readAsDataURL(blob);
          frameCount++;
          lastFrameTime = timestamp;

          if (frameCount < totalFrames) {
            requestAnimationFrame(drawFrame);
          } else {
            resolve(frames);
          }
        }, MIMETYPES.webp);
      } else {
        requestAnimationFrame(drawFrame);
      }
    }
    requestAnimationFrame(drawFrame);
  });
};

export async function loadSVG(svgDataUrl) {
  const response = await fetch(svgDataUrl);
  const svgText = await response.text();
  const blob = new Blob([svgText], { type: MIMETYPES.svg });
  const url = URL.createObjectURL(blob);

  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = (e) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.height = 1000;
      img.width = 1000;
      img.onload = () => {
        // URL.revokeObjectURL(url);
        console.log("load fetch svg url", url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.readAsDataURL(blob);
  });
}

export async function framesToVideo(frames, canvas) {
  console.log("recording video");
  return new Promise((resolve) => {
    const stream = canvas.captureStream(FPS);
    const recorder = new RecordRTC(stream, {
      type: "video",
      mimeType: MIMETYPES.webm,
      frameRate: FPS,
      video: { width: RESOLUTION.width, height: RESOLUTION.height },
    });

    recorder.startRecording();
    frames.forEach((frame, index) => {
      setTimeout(() => {
        const img = new Image();
        img.src = frame;
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
        };
      }, (index * 6000) / FPS);
    });

    setTimeout(() => {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        resolve(url);
      });
    }, 2000);
  });
}

export function downloadGIF(output) {
  var link = document.createElement("a");
  link.href = output;
  link.download = "Download.gif";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
