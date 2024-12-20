import React, { useEffect, useState } from "react";

const VideoPlayer = ({ userId, videoId }) => {
    const [error, setError] = useState(null);
    const videoSrc = `http://localhost:4002/video?userId=${userId}&videoId=${encodeURIComponent(videoId)}`;

    useEffect(() => {
        console.log(`VideoPlayer initialized for userId: ${userId}, videoId: ${videoId}`);
        console.log(`Video source URL: ${videoSrc}`);
    }, [userId, videoId, videoSrc]);

    const handleError = () => {
        console.error(`Error loading video from ${videoSrc}`);
        setError("Failed to load video. Please try again later.");
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Video Player</h1>
                    {error ? (
                        <div className="text-center p-4 bg-red-50 rounded-md text-red-700">
                            Error: {error}
                        </div>
                    ) : (
                        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg">
                            <video
                                controls
                                className="w-full h-full object-contain bg-black"
                                onError={handleError}
                            >
                                <source src={videoSrc} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;