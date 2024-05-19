// useVideoConversion.js
import { useState } from "react";
import { convertVideoToGif } from "./ffmpeg";

const useVideoConversion = (ffmpeg) => {
  const [output, setOutput] = useState(null);

  const convertVideo = async (videoFile) => {
    const gifUrl = await convertVideoToGif(ffmpeg, videoFile);
    setOutput(gifUrl);
  };

  return { output, convertVideo };
};

export default useVideoConversion;
