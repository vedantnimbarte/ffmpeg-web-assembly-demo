import RecordRTC from "recordrtc";
import { FPS, MIMETYPES, RESOLUTION } from "../utils/constants";

/**
 * A class for recording media streams.
 */
export default class Recorder {
  /**
   * Constructor for creating a new Recorder instance.
   * @param {Object} options - The options for configuring the recorder.
   * @param {MediaStream} options.stream - The media stream to record.
   * @param {string} [options.mimeType=video/webm] - The MIME type of the recording.
   * @param {number} [options.frameRate=30] - The frame rate of the recording.
   * @param {number} [options.videoHeight=980] - The height of the video recording.
   * @param {number} [options.videoWidth=1920] - The width of the video recording.
   * @param {boolean} [options.disableLogs=true] - Flag to disable logs.
   * @param {string} [options.type='video'] - The type of recording.
   */
  constructor(
    stream,
    {
      mimeType = MIMETYPES.webm,
      frameRate = FPS,
      videoHeight = RESOLUTION.height,
      videoWidth = RESOLUTION.width,
      disableLogs = false,
      type = "video",
    } = {}
  ) {
    if (!stream) throw new Error("Media stream is required");
    this._stream = stream;
    this._recorder = new RecordRTC(stream, {
      type,
      mimeType,
      frameRate,
      video: { width: videoWidth, height: videoHeight },
      width: videoWidth,
      height: videoHeight,
      disableLogs,
      quality: 10,
    });
  }

  /**
   * Starts the recording.
   * @returns {void}
   */
  startRecording() {
    this._recorder.startRecording();
  }

  /**
   * Stops the recording after a specified duration.
   * @param {number} autoStopAfter - The duration in milliseconds after which the recording should stop.
   * @param {function} onRecordingStopped - The callback function to be called when the recording stops.
   * @returns {void}
   */
  stopRecordingAfter(autoStopAfter, cb = null) {
    this._recorder
      .setRecordingDuration(autoStopAfter)
      .onRecordingStopped(() => {
        if (typeof cb === "function") {
          const blob = this._recorder.getBlob();
          cb(URL.createObjectURL(blob));
        }
      });
  }

  /**
   * Stops the recording and invokes the provided callback with the URL of the recorded data.
   * @param {function} callback - The callback function to be invoked after the recording stops. It will receive the URL of the recorded data as a parameter.
   * @returns {void}
   */
  stopRecording(callback) {
    this._recorder.stopRecording(async () => {
      const blob = this._recorder.getBlob();
      callback(URL.createObjectURL(blob));
    });
  }

  /**
   * Gets the blob data from the recorder.
   *
   * @return {Blob} The blob data obtained from the recorder.
   */
  getBlob() {
    return this._recorder.getBlob();
  }
}
