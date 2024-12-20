import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { XCircleIcon } from '@heroicons/react/24/solid';
import {
    VideoIcon,
    TrashIcon,
    UploadIcon,
    LogOutIcon,
    SearchIcon
} from 'lucide-react';

const VideoList = ({ userId }) => {
    const [videos, setVideos] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetchVideos(token);
    }, [userId]);

    const fetchVideos = async (token) => {
        try {
            const response = await axios.get(`http://localhost:4002/videos`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    userid: userId
                }
            });
            setVideos(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleDelete = async (videoId) => {
        if (!window.confirm('Are you sure you want to delete this video?')) return;

        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:4005/delete`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    userid: userId,
                    id: videoId
                }
            });
            setVideos(videos.filter(video => video.videoId !== videoId));
        } catch (error) {
            setError("Failed to delete video. Please try again.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        navigate('/');
    };

    const filteredVideos = videos.filter(video =>
        video.videoId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex-shrink-0 flex items-center">
                            <h1 className="text-xl font-bold text-indigo-600">Personal Cloud</h1>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700"
                            >
                                <LogOutIcon className="h-5 w-5 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Search and Upload Section */}
                <div className="flex justify-between items-center mb-6">
                    <div className="relative flex-1 max-w-xs">
                        <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search videos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button
                        onClick={() => navigate('/upload')}
                        className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <UploadIcon className="h-5 w-5 mr-2" />
                        Upload Video
                    </button>
                </div>

                {/* Video Grid */}
                {error ? (
                    <div className="rounded-md bg-red-50 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredVideos.map((video) => (
                            <motion.div
                                key={video.videoId}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white overflow-hidden rounded-lg shadow hover:shadow-md transition-shadow duration-300"
                            >
                                <Link to={`/video/${userId}/${encodeURIComponent(video.videoId)}`}>
                                    <div className="p-6">
                                        <div className="flex items-center">
                                            <VideoIcon className="h-8 w-8 text-indigo-600" />
                                            <div className="ml-4">
                                                <h3 className="text-lg font-medium text-gray-900 truncate">
                                                    {video.videoId}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(video.uploadDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                <div className="bg-gray-50 px-6 py-3">
                                    <button
                                        onClick={() => handleDelete(video.videoId)}
                                        className="inline-flex items-center text-sm text-red-600 hover:text-red-700"
                                    >
                                        <TrashIcon className="h-4 w-4 mr-1" />
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoList;