// useVideoConversion.js
import { useEffect, useRef } from "react";
import useFFmpeg from "./useFFmpeg";
import { convertSvgToVideo, downloadGIF } from "../utils/functions";
import { convertVideoToGif, fetchFile } from "../ffmpeg";

const useConversion = ({
  disableLogs = false,
  downloadOnComplete = true,
} = {}) => {
  const { ffmpeg, loaded } = useFFmpeg();

  const convertToGIF = async (SvgFileUrl) => {
    const videoUrlWebm = await convertSvgToVideo(SvgFileUrl);
    await saveFileToFfmpegFs("input.webm", videoUrlWebm);
    const gifURL = await convertVideoToGif(ffmpeg);
    if (downloadOnComplete) downloadGIF(gifURL);
    return gifURL;
  };

  const saveFileToFfmpegFs = async (fileName, url) => {
    try {
      await ffmpeg.writeFile(fileName, await fetchFile(url));
      return true;
    } catch (error) {
      return false;
    }
  };

  const onLog = (cb = null) => {
    ffmpeg?.on("log", ({ message, type }) => {
      console.log({ type, message });
      if (typeof cb === "function") cb({ type, message });
    });
  };

  const onProgress = (cb = null) => {
    ffmpeg?.on("progress", ({ progress, time }) => {
      console.log({ time, progress });
      if (typeof cb === "function") cb({ time, progress });
    });
  };

  useEffect(() => {
    if (!disableLogs) {
      onLog();
      onProgress();
    }
  });

  return {
    convertToGIF,
    saveFileToFfmpegFs,
    onLog,
    onProgress,
    convertSvgToVideo,
    ffmpeg,
    ffmpegInstanceLoaded: loaded,
  };
};

export default useConversion;
