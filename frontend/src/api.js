import axios from "axios";

// Hardcoded values for localhost and port 4002
const videoStreamingHost = 'localhost'; // Change to 'localhost' for local development
const videoStreamingPort = '4002'; // Port 4002

const api = {
    fetchUserVideos: (userId) =>
        axios.get(`http://${videoStreamingHost}:${videoStreamingPort}/videos?userId=${userId}`),
    streamVideo: (videoId) =>
        `http://${videoStreamingHost}:${videoStreamingPort}/video?path=${encodeURIComponent(videoId)}`,
};

export default api;