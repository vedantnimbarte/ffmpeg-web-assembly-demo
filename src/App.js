// App.js
import { useEffect, useMemo, useRef, useState } from "react";
import useFFmpeg from "./useFFmpeg";
import useVideoConversion from "./useVideoConversion";
import {
  captureAnimationFrames,
  downloadGIF,
  framesToVideo,
  loadSVG,
  renderTextWithEl,
} from "./utils/functions";
import { DURATION, FPS, MIMETYPES, RESOLUTION } from "./utils/constants";
import { fetchFile } from "@ffmpeg/util";

function App() {
  const { loaded, ffmpeg } = useFFmpeg();
  const { convertVideo, output, saveFile } = useVideoConversion(ffmpeg);
  const [gifFrames, setGifFrames] = useState(null);
  const ffmpegLogRef = useRef(null);
  const [processing, setProcessing] = useState(false);

  async function svgToMp4(svgDataUrl, duration, fps) {
    const canvas = document.createElement("canvas");

    console.log("svgDataUrl", svgDataUrl);

    const svgImg = await loadSVG(svgDataUrl);

    renderTextWithEl("Preview of SVG", svgImg);

    const frames = await captureAnimationFrames(
      svgImg,
      canvas,
      duration,
      fps,
      setGifFrames,
      ffmpeg
    );
    console.log("[GENERATING VIDEO FROM FRAMES]");
    await ffmpeg.exec([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "input.txt",
      "-vf",
      "fps=25",
      "-pix_fmt",
      "yuv420p",
      "output.webm",
    ]);
    const data = await ffmpeg.readFile("output.webm");
    const videoDataUrl = URL.createObjectURL(
      new Blob([data.buffer], { type: MIMETYPES.webm })
    );
    console.log("[GENERATED VIDEO FROM FRAMES]", videoDataUrl);
    const webMBlob = await framesToVideo(frames, canvas, fps, duration * 1000);

    console.log("webm blobl url", URL.createObjectURL(webMBlob));

    return webMBlob;
  }

  ffmpeg?.on("log", ({ message }) => {
    console.log("ffmpeg", message);
    ffmpegLogRef.current.innerText = message;
  });

  const convert = (svgFile) => {
    svgToMp4(svgFile, DURATION, FPS)
      .then(async (mp4Blob) => {
        await saveFile(mp4Blob);

        convertVideo();
      })
      .catch((err) => console.log("error", err))
      .finally(() => {
        setGifFrames(null);
      });
  };

  const handleFileChange = async (e) => {
    try {
      setProcessing(true);
      const formdata = new FormData();
      formdata.append("svg", e.target.files[0]);
      const response = await fetch("http://45.129.87.115:3001/upload", {
        method: "POST",
        body: formdata,
      });
      const result = await response.json();

      // convert(URL.createObjectURL(e.target.files[0]));
      // convert(result.videoPath)
      const apiURL = `http://45.129.87.115:3001/video/${result.videoPath}`;
      await ffmpeg.writeFile("input.mp4", await fetchFile(apiURL));
      await ffmpeg.exec([
        "-y",
        "-i",
        "input.mp4",
        "-vf",
        `fps=${FPS},scale=${RESOLUTION.width}:${RESOLUTION.height}:flags=lanczos,palettegen=max_colors=256`,
        "palette.png",
      ]);

      await ffmpeg.exec([
        "-y",
        "-i",
        "input.mp4",
        "-i",
        "palette.png",
        "-filter_complex",
        `scale=${RESOLUTION.width}:${RESOLUTION.height}:flags=lanczos[x];[x][1:v]paletteuse,setpts=2*PTS`,
        "-r",
        `${FPS}`,
        "-loop",
        "0",
        "-c:v",
        "gif",
        "output.gif",
      ]);
      const data = await ffmpeg.readFile("output.gif");
      const output = URL.createObjectURL(
        new Blob([data.buffer], { type: MIMETYPES.gif })
      );
      downloadGIF(output);
    } catch (error) {
      console.log("error", error);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (output) {
      downloadGIF(output);
    }
  }, [output]);

  const percentage = useMemo(() => {
    if (gifFrames) {
      return (gifFrames.currentFrame / gifFrames.totalFrames) * 100;
    }
    return 0;
  }, [gifFrames]);

  return loaded ? (
    <div>
      {processing ? (
        <p>Processing...</p>
      ) : (
        <input type="file" accept="image/svg" onChange={handleFileChange} />
      )}

      <p>
        FFMPEG LOG: <span ref={ffmpegLogRef}></span>
      </p>
    </div>
  ) : (
    <p>Loading...</p>
  );
}

export default App;
