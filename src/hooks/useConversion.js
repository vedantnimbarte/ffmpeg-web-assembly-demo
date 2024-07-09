// useVideoConversion.js
import { useEffect } from "react";
import useFFmpeg from "./useFFmpeg";
import {
  convertSvgToVideo,
  downloadGIF,
  removeElWithText,
} from "../utils/functions";
import { convertVideoToGif, fetchFile } from "../ffmpeg";

/**
 * Initializes the conversion functionality with options.
 *
 * @param {Object} options - The options object.
 * @param {boolean} options.disableLogs - Flag to disable logs. Default is false.
 * @param {boolean} options.downloadOnComplete - Flag to download on completion. Default is true.
 * @return {Object} An object containing conversion functions and ffmpeg instance information.
 */
const useConversion = ({
  disableLogs = false,
  downloadOnComplete = true,
} = {}) => {
  const { ffmpeg, loaded } = useFFmpeg();

  /**
   * Converts an SVG file to a GIF.
   *
   * @param {string} SvgFileUrl - The URL of the SVG file.
   * @return {Promise<string>} A promise that resolves with the URL of the generated GIF.
   */
  const convertToGIF = async (SvgFileUrl) => {
    const videoUrlWebm = await convertSvgToVideo(SvgFileUrl);
    await saveFileToFfmpegFs("input.webm", videoUrlWebm);
    const gifURL = await convertVideoToGif(ffmpeg);
    if (downloadOnComplete) downloadGIF(gifURL);
    removeElWithText("Preview of SVG");
    return gifURL;
  };

  /**
   * Saves a file to Ffmpeg file system.
   *
   * @param {string} fileName - The name of the file to save.
   * @param {string} url - The URL of the file to fetch.
   * @return {boolean} True if the file is successfully saved, false otherwise.
   */
  const saveFileToFfmpegFs = async (fileName, url) => {
    try {
      await ffmpeg.writeFile(fileName, await fetchFile(url));
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Registers a callback function to be called when a log event occurs.
   *
   * @param {function} cb - The callback function to be called. If not provided, the default is null.
   * @return {void}
   */
  const onLog = (cb = null) => {
    ffmpeg?.on("log", ({ message, type }) => {
      console.log({ type, message });
      if (typeof cb === "function") cb({ type, message });
    });
  };

  /**
   * Attaches a progress event listener to the ffmpeg instance.
   *
   * @param {function} cb - The callback function to be called with progress information.
   * @return {void}
   */
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
