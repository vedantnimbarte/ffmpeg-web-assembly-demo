// ffmpegUtils.js
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { FPS, MIMETYPES, RESOLUTION } from "./utils/constants";

const loadFFmpeg = async () => {
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, MIMETYPES.json),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, MIMETYPES.wasm),
  });
  window.ffmpeg = ffmpeg;
  return ffmpeg;
};

const convertVideoToGif = async (ffmpeg) => {
  await ffmpeg.exec([
    "-i",
    "input.webm",
    "-vf",
    `fps=${FPS},scale=${RESOLUTION.width}:${RESOLUTION.height}:flags=lanczos,palettegen=max_colors=256`,
    "palette.png",
  ]);

  await ffmpeg.exec([
    "-i",
    "input.webm",
    "-i",
    "palette.png",
    "-filter_complex",
    `scale=${RESOLUTION.width}:${RESOLUTION.height}:flags=lanczos[x];[x][1:v]paletteuse,setpts=2*PTS`,
    "-r",
    `${FPS}`,
    "-c:v",
    "gif",
    "output.gif",
  ]);
  const data = await ffmpeg.readFile("output.gif");
  return URL.createObjectURL(new Blob([data.buffer], { type: MIMETYPES.gif }));
};

export { loadFFmpeg, convertVideoToGif, fetchFile };
