// useVideoConversion.js
import { useState } from "react";
import { convertVideoToGif, fetchFile } from "./ffmpeg";

const useVideoConversion = (ffmpeg) => {
  const [output, setOutput] = useState(null);

  const convertVideo = async () => {
    try {
      const gifUrl = await convertVideoToGif(ffmpeg);
      setOutput(gifUrl);
    } catch (error) {
      console.log("error", error);
    }
  };

  const saveFile = async (url) => {
    try {
      await ffmpeg.writeFile("input.webm", await fetchFile(url));
      return true;
    } catch (error) {
      return false;
    }
  };

  return { output, convertVideo, saveFile };
};

export default useVideoConversion;
