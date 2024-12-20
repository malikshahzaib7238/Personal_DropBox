import React, { useState } from "react";
import axios from "axios";

// Function to get video title (placeholder for real implementation)
const getVideoTitle = (videoFile) => {
    return new Promise((resolve) => {
        const title = videoFile.name || "No title available"; // Use filename if no metadata available
        resolve(title);
    });
};

const VideoUpload = ({ userId }) => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) {
            setMessage("Please select a video file.");
            return;
        }

        const formData = new FormData();
        const videoTitle = await getVideoTitle(file);
        formData.append("file", file);
        
        try {
            // Post to server
            const response = await axios.post(
                `http://localhost:4003/upload`,
                formData,
                {
                    headers: {
                        "userid": userId,
                        "Id": videoTitle,
                    },
                }
            );

            console.log("Upload response:", response.data);
            setMessage(`Video uploaded successfully: ${response.data.message || "Success"}`);
        } catch (error) {
            console.error("Error uploading video:", error);
            setMessage("Failed to upload video. Please try again.");
        }
    };
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
                <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Upload Video</h1>
                <form onSubmit={handleUpload} className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Video File
                        </label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            required
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                    >
                        Upload
                    </button>
                </form>
                {message && (
                    <div className={`mt-4 p-4 rounded-md ${message.includes("successfully") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoUpload;