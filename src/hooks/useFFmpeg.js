// useFFmpeg.js
import { useEffect, useState } from "react";
import { loadFFmpeg } from "../ffmpeg";

const useFFmpeg = () => {
  const [loaded, setLoaded] = useState(false);
  const [ffmpeg, setFFmpeg] = useState(null);

  useEffect(() => {
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
