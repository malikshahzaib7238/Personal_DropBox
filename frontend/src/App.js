import React, { useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import VideoUpload from "./VideoUpload";
import VideoList from "./VideoList";
import VideoPlayer from "./VideoPlayer";
import { useParams } from "react-router-dom";
import './index.css';
import AuthComponent from "./Authentication";
import Welcome from "./Welcome";;
const App = () => {
    const userId = localStorage.getItem('userId');

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Welcome/>} />
                <Route path="/videos/:userId" element={<VideoListWrapper />} />
                <Route path="/upload" element={<VideoUpload userId={userId} />} />
                <Route path="/video/:userId/:videoId" element={<VideoPlayerWrapper />} />

                <Route path="/login" element={<AuthComponent/>}/>
            </Routes>
        </Router>
    );
};

const Login = ({ setUserId }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const response = await axios.post("http://localhost:4007/authenticate", {
                username: username,
                password: password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const { userId } = response.data;
            if (userId) {
                setUserId(userId);
                navigate(`/videos/${userId}`);
            }
        } catch (err) {
            setError("Invalid username or password.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
                <h1 className="text-3xl font-bold text-center text-gray-900">Login</h1>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                        onClick={handleLogin}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Login
                    </button>
                    {error && (
                        <p className="text-red-600 text-center">{error}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const VideoListWrapper = () => {
    const { userId } = useParams();
    return <VideoList userId={userId} />;
};

const VideoPlayerWrapper = () => {
    const { userId, videoId } = useParams();
    return <VideoPlayer userId={userId} videoId={videoId} />;
};

export default App;