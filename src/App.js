// App.js
import { useEffect, useMemo, useRef, useState } from "react";
import useFFmpeg from "./useFFmpeg";
import useVideoConversion from "./useVideoConversion";
import "webrtc-adapter";

const duration = 5000; // duration is in milliseconds

async function loadSVG(svgDataUrl) {
  const response = await fetch(svgDataUrl);
  const svgText = await response.text();
  const blob = new Blob([svgText], { type: "image/svg+xml" });
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

function App() {
  const { loaded, ffmpeg } = useFFmpeg();
  const { convertVideo, output } = useVideoConversion(ffmpeg);
  const [processing, setProcessing] = useState(false);
  const [gifFrames, setGifFrames] = useState(null);
  const ffmpegLogRef = useRef(null);

  function renderTextWithEl(text, element) {
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

  async function captureAnimationFrames(svgImg, canvas, duration, fps) {
    const frames = [];
    const ctx = canvas.getContext("2d");
    const totalFrames = duration * fps;
    const interval = 1000 / fps;

    canvas.height = svgImg.height;
    canvas.width = svgImg.width;

    return new Promise((resolve) => {
      let frameCount = 0;
      console.log("svg", { height: svgImg.height, width: svgImg.width });

      function drawFrame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(svgImg, 0, 0);
        frames.push(canvas.toDataURL("image/webp"));
        frameCount++;
        if (frameCount < totalFrames) {
          setGifFrames({ totalFrames, currentFrame: frameCount });
          setTimeout(drawFrame, interval);
        } else {
          resolve(frames);
        }
      }

      drawFrame();
    });
  }

  async function framesToVideo(frames, canvas, fps) {
    return new Promise((resolve) => {
      const stream = canvas.captureStream(fps);
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          const blob = new Blob([e.data], { type: "video/webm" });
          console.log("resolving webm video", e.data.type);
          resolve(blob);
        }
      };

      mediaRecorder.start();
      frames.forEach((frame, index) => {
        // console.log("frame timeout duration", {
        //   index,
        //   duration: (index * 1000) / fps,
        //   fps,
        // });
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
        mediaRecorder.stop();
      }, duration);
    });
  }

  async function convertWebMToMP4(webMBlob) {
    const webMArrayBuffer = await webMBlob.arrayBuffer();
    ffmpeg.writeFile("input.webm", new Uint8Array(webMArrayBuffer));

    await ffmpeg.exec(["-i", "input.webm", "output.mp4"]);

    const data = ffmpeg.readFile("output.mp4");
    const mp4Blob = new Blob([data.buffer], { type: "video/mp4" });
    return mp4Blob;
  }

  async function svgToMp4(svgDataUrl, duration, fps) {
    const canvas = document.createElement("canvas");

    console.log("svgDataUrl", svgDataUrl);

    const svgImg = await loadSVG(svgDataUrl);

    renderTextWithEl("SVG Canvas", canvas);

    renderTextWithEl("Preview of SVG", svgImg);

    const frames = await captureAnimationFrames(svgImg, canvas, duration, fps);
    const webMBlob = await framesToVideo(frames, canvas, fps);

    const mp4Blob = await convertWebMToMP4(webMBlob);
    return mp4Blob;
  }

  ffmpeg?.on("log", ({ message }) => {
    ffmpegLogRef.current.innerText = message;
  });

  const convert = (svgFile) => {
    setProcessing(true);
    svgToMp4(svgFile, 5, 10)
      .then((mp4Blob) => {
        // Create a video element to play the MP4 video in the browser
        const videoUrl = URL.createObjectURL(mp4Blob);
        console.log("video url", videoUrl);

        convertVideo(videoUrl);
      })
      .catch((err) => console.log("error", err))
      .finally(() => {
        setGifFrames(null);
        setProcessing(false);
      });
  };

  const handleFileChange = (e) => {
    convert(URL.createObjectURL(e.target.files[0]));
  };

  useEffect(() => {
    if (output) {
      var link = document.createElement("a");
      link.href = output;
      link.download = "Download.gif";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

      {processing ? (
        <div>
          <p>Processing GIF {percentage.toFixed(2)}%</p>
        </div>
      ) : (
        <button onClick={convert}>Convert to GIF</button>
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
