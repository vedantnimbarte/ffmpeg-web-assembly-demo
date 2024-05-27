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
import { DURATION, FPS } from "./utils/constants";

function App() {
  const { loaded, ffmpeg } = useFFmpeg();
  const { convertVideo, output, saveFile } = useVideoConversion(ffmpeg);
  const [gifFrames, setGifFrames] = useState(null);
  const ffmpegLogRef = useRef(null);

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
      setGifFrames
    );
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

  const handleFileChange = (e) => {
    convert(URL.createObjectURL(e.target.files[0]));
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
      <input type="file" accept="image/svg" onChange={handleFileChange} />

      {gifFrames && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p>{percentage.toFixed(2)}%</p>
          <progress
            value={percentage}
            max="100"
            style={{ width: "100%" }}
          ></progress>
        </div>
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
