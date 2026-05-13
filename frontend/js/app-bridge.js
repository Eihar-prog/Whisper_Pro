import { newSegment, transcriptionEnd } from './audio/transcriber.js';

window.appBridge = {
  handleNewSegment: function (segment) {
    newSegment(segment);
  },
  handleTranscriptionEnd: function () {
    transcriptionEnd();
  },
};
