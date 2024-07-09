import Recorder from "../libs/Recorder.lib";
import {
  FPS,
  MIMETYPES,
  RECORDING_DURATION_IN_MS,
  RESOLUTION,
} from "./constants";

/**
 * Renders text within an element and appends it to the document body.
 *
 * @param {string} text - The text content to render.
 * @param {Element} element - The element to append the text to.
 * @return {void}
 */
export function renderTextWithEl(text, element) {
  const container = document.createElement("div");
  container.id = text.split(" ").join("-").toLowerCase();
  container.style =
    "border: 1px solid black; border-radius: 5px; padding: 3px; height: 550px; width: 1000px;";
  const textEl = document.createElement("p");
  textEl.innerText = text;
  container.appendChild(textEl);
  container.appendChild(element);
  document.body.appendChild(container);
  return;
}

/**
 * Removes an element with the specified text content.
 *
 * @param {string} text - The text content used to identify the element to remove.
 * @return {void}
 */
export function removeElWithText(text) {
  const container = document.getElementById(
    text.split(" ").join("-").toLowerCase()
  );
  container.remove();
}

/**
 * Captures an animation video from an SVG image on a canvas.
 *
 * @param {HTMLImageElement} svgImg - The SVG image element to capture.
 * @param {HTMLCanvasElement} canvas - The canvas element to draw the SVG image on.
 * @return {Promise<MediaStream>} A promise that resolves to the recorded video stream.
 */
export const captureSvgAnimationVideo = async (svgImg, canvas) => {
  let animationRequestId;

  const stream = canvas.captureStream(FPS);

  canvas.height = RESOLUTION.height;
  canvas.width = RESOLUTION.width;

  return new Promise((resolve) => {
    const recorder = new Recorder(stream);
    recorder.stopRecordingAfter(RECORDING_DURATION_IN_MS, (recording) => {
      cancelAnimationFrame(animationRequestId);
      resolve(recording);
    });
    recorder.startRecording();

    function drawFrame() {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(svgImg, 0, 0);
      animationRequestId = requestAnimationFrame(drawFrame);
    }
    drawFrame();
  });
};

/**
 * Asynchronously loads an SVG image from the provided URL.
 *
 * @param {string} svgDataUrl - The URL of the SVG data.
 * @return {Promise<Image>} A promise that resolves with the loaded image.
 */
export async function loadSVG(svgDataUrl) {
  const response = await fetch(svgDataUrl);
  const svgText = await response.text();
  const blob = new Blob([svgText], { type: MIMETYPES.svg });

  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Asynchronously converts SVG data to a video.
 *
 * @param {string} svgDataUrl - The URL of the SVG data.
 * @return {Promise<string>} A promise that resolves with the URL of the generated video.
 */
export async function convertSvgToVideo(svgDataUrl) {
  const canvas = document.createElement("canvas");
  const svgImg = await loadSVG(svgDataUrl);

  renderTextWithEl("Preview of SVG", svgImg);
  const videoUrl = await captureSvgAnimationVideo(svgImg, canvas);
  return videoUrl;
}

/**
 * Downloads a GIF file by creating a temporary link element, setting its href and download attributes,
 * appending it to the document body, triggering a click event, and then removing it from the document body.
 *
 * @param {string} output - The URL of the GIF file to be downloaded.
 * @return {void} This function does not return anything.
 */
export function downloadGIF(output) {
  var link = document.createElement("a");
  link.href = output;
  link.download = "Download.gif";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
