// useFFmpeg.js
import { useEffect, useState } from "react";
import { loadFFmpeg } from "../ffmpeg";

/**
 * Function to load FFmpeg asynchronously.
 *
 * @return {Object} Object containing the loaded state and the FFmpeg instance
 */
const useFFmpeg = () => {
  const [loaded, setLoaded] = useState(false);
  const [ffmpeg, setFFmpeg] = useState(null);

  useEffect(() => {
    /**
     * Function to load FFmpeg asynchronously.
     */
    const load = async () => {
      const ffmpegInstance = await loadFFmpeg();
      setFFmpeg(ffmpegInstance);
      setLoaded(true);
      console.log("LOADED FFMPEG WEB ASSEMBLY");
    };
    load();
  }, []);

  return { loaded, ffmpeg };
};

export default useFFmpeg;
