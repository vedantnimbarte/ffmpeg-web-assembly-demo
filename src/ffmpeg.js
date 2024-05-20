// ffmpegUtils.js
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const loadFFmpeg = async () => {
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  return ffmpeg;
};

// ffmpeg -i input_video.mp4 -vf "fps=15,scale=320:240:flags=lanczos" -gifflags +transdiff -y output.gif

const convertVideoToGif = async (ffmpeg, videoFile) => {
  await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile));
  await ffmpeg.exec([
    "-i",
    "input.webm",
    "-vf",
    "fps=60,scale=1920:-1:flags=lanczos,setpts=2*PTS",
    "-loop",
    "0",
    "-c:v",
    "gif",
    "output.gif",
  ]);
  const data = await ffmpeg.readFile("output.gif");
  return URL.createObjectURL(new Blob([data.buffer], { type: "image/gif" }));
};

export { loadFFmpeg, convertVideoToGif };
