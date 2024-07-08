// App.js
import { useEffect, useRef, useState } from "react";
import useFFmpeg from "./useFFmpeg";
import useVideoConversion from "./useVideoConversion";
import {
  captureSvgAnimationVideo,
  downloadGIF,
  loadSVG,
  renderTextWithEl,
} from "./utils/functions";
import { MIMETYPES } from "./utils/constants";
import { fetchFile } from "./ffmpeg";

function App() {
  const { loaded, ffmpeg } = useFFmpeg();
  const { convertVideo, output, saveFile } = useVideoConversion(ffmpeg);
  const ffmpegLogRef = useRef(null);
  const [processing, setProcessing] = useState(false);

  async function svgToMp4(svgDataUrl) {
    const canvas = document.createElement("canvas");

    const svgImg = await loadSVG(svgDataUrl);

    renderTextWithEl("Preview of SVG", svgImg);

    const videoUrl = await captureSvgAnimationVideo(svgImg, canvas);
    console.log("CAPTURED VIDEO URL", videoUrl);

    return videoUrl;
  }

  ffmpeg?.on("log", ({ message }) => {
    console.log("ffmpeg", message);
    ffmpegLogRef.current.innerText = message;
  });

  const convert = (svgFile) => {
    svgToMp4(svgFile)
      .then(async (videoUrlWebm) => {
        await saveFile(videoUrlWebm);

        convertVideo();
      })
      .catch((err) => console.log("error", err));
  };

  const handleFileChange = async (e) => {
    try {
      setProcessing(true);
      convert(URL.createObjectURL(e.target.files[0]));
    } catch (error) {
      console.log("error", error);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (output) {
      downloadGIF(output);
      // window.open(output, "_blank");
    }
  }, [output]);

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
