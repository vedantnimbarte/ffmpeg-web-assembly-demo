import { fetchFile } from "@ffmpeg/util";
import { MIMETYPES } from "./constants";

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

export const captureAnimationFrames = async (
  svgImg,
  canvas,
  duration,
  fps,
  setGifFrames,
  ffmpeg
) => {
  const frames = [];
  const ctx = canvas.getContext("2d");
  const totalFrames = duration * fps;
  const interval = 1000 / fps;
  let lastFrameTime = performance.now();

  canvas.height = svgImg.height;
  canvas.width = svgImg.width;

  return new Promise(async (resolve) => {
    let frameCount = 0;
    await ffmpeg.createDir("frames");
    let inputTxtFileContent = "";
    function drawFrame(timestamp) {
      if (timestamp - lastFrameTime >= interval) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(svgImg, 0, 0);

        canvas.toBlob(async (blob) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            frames.push(e.target.result);
            const imageName = `frames/frame${frameCount}.png`;
            await ffmpeg.writeFile(imageName, e.target.result);
            inputTxtFileContent += `file '${imageName}'\n`;
          };
          await ffmpeg.writeFile(
            `frames/frame${frameCount}.png`,
            URL.createObjectURL(blob)
          );
          reader.readAsDataURL(blob);
          frameCount++;
          lastFrameTime = timestamp;

          setGifFrames({ totalFrames, currentFrame: frameCount });

          if (frameCount < totalFrames) {
            console.log("getting frame", {
              currentFrame: frameCount,
              totalFrames,
            });
            requestAnimationFrame(drawFrame);
          } else {
            await ffmpeg.writeFile("input.txt", inputTxtFileContent);
            console.log("[FRAMES CONTENT]", inputTxtFileContent);
            resolve(frames);
          }
        }, MIMETYPES.png);
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

export async function framesToVideo(frames, canvas, fps, duration) {
  console.log("recording video");
  return new Promise((resolve) => {
    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        console.log("data available", e.data);
        const blob = new Blob([e.data], { type: MIMETYPES.webm });
        resolve(blob);
      }
    };

    mediaRecorder.start();
    frames.forEach((frame, index) => {
      setTimeout(() => {
        const img = new Image();
        img.src = frame;
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
        };
      }, (index * 1000) / fps);
    });

    setTimeout(() => {
      console.log("stopping recording");
      mediaRecorder.stop();
    }, duration);
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
