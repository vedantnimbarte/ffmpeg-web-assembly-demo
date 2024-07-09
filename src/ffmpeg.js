// ffmpegUtils.js
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { FPS, MIMETYPES, RESOLUTION } from "./utils/constants";

/**
 * Asynchronously loads FFmpeg and initializes it with the core and wasm files.
 *
 * @return {Promise<FFmpeg>} A promise that resolves with the loaded FFmpeg instance.
 */
export const loadFFmpeg = async () => {
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, MIMETYPES.json),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, MIMETYPES.wasm),
  });
  window.ffmpeg = ffmpeg;
  return ffmpeg;
};

/**
 * Converts a video file to a GIF using FFmpeg.
 *
 * @param {Object} ffmpeg - The FFmpeg instance.
 * @return {Promise<string>} A Promise that resolves to the URL of the generated GIF.
 */
export const convertVideoToGif = async (ffmpeg) => {
  await ffmpeg.exec([
    "-y",
    "-i",
    "input.webm",
    "-vf",
    `minterpolate='mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=${FPS}'`,
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "1M",
    "input.webm",
  ]);
  await ffmpeg.exec([
    "-y",
    "-i",
    "input.webm",
    "-vf",
    `fps=${FPS},scale=${RESOLUTION.width}:${RESOLUTION.height}:flags=lanczos,palettegen=max_colors=256`,
    "palette.png",
  ]);

  await ffmpeg.exec([
    "-v",
    "debug",
    "-y",
    "-i",
    "input.webm",
    "-i",
    "palette.png",
    "-filter_complex",
    `scale=${RESOLUTION.width}:${RESOLUTION.height}:flags=lanczos,unsharp=5:5:1.0[x];[x][1:v]paletteuse`,
    "-r",
    `${FPS}`,
    "-c:v",
    "gif",
    "output.gif",
  ]);
  const data = await ffmpeg.readFile("output.gif");
  return URL.createObjectURL(new Blob([data.buffer], { type: MIMETYPES.gif }));
};

export { fetchFile };
