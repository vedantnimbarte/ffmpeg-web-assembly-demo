// App.js
import { useState } from "react";
import useConversion from "./hooks/useConversion";

function App() {
  const { convertToGIF, ffmpegInstanceLoaded } = useConversion();

  const [processing, setProcessing] = useState(false);

  const handleFileChange = async (e) => {
    try {
      setProcessing(true);
      await convertToGIF(URL.createObjectURL(e.target.files[0]));
    } catch (error) {
      console.log("error", error);
      setProcessing(false);
    } finally {
      setProcessing(false);
    }
  };

  return ffmpegInstanceLoaded ? (
    <div>
      {processing ? (
        <p>Processing...</p>
      ) : (
        <input type="file" accept="image/svg" onChange={handleFileChange} />
      )}
    </div>
  ) : (
    <p>Loading...</p>
  );
}

export default App;
