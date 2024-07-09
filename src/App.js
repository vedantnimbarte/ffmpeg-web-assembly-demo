// App.js
import { useState } from "react";
import useConversion from "./hooks/useConversion";

function App() {
  const { convertToGIF, ffmpegInstanceLoaded } = useConversion({
    downloadOnComplete: false,
  });

  const [processing, setProcessing] = useState(false);

  /**
   * Asynchronously handles the file change event.
   *
   * @param {Event} e - The event object.
   * @return {Promise<void>} Promise that resolves after handling the file change.
   */
  const handleFileChange = async (e) => {
    try {
      setProcessing(true);
      const gif = await convertToGIF(URL.createObjectURL(e.target.files[0]));
      window.open(gif, "_blank");
    } catch (error) {
      console.log("error", error);
      setProcessing(false);
    } finally {
      setProcessing(false);
    }
  };

  if (processing) return <p>Processing...</p>;

  if (!ffmpegInstanceLoaded) return <p>Loading...</p>;

  return (
    <div>
      <input type="file" accept="image/svg" onChange={handleFileChange} />
    </div>
  );
}

export default App;
