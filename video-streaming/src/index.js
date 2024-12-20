const express = require("express");
const http = require("http");
const mongodb = require("mongodb");
const cors = require("cors"); // Import CORS middleware

const app = express();

// Enable CORS for all routes
app.use(cors());  // Allows all origins, you can customize if needed


app.use(express.json());  // This is important for handling POST body

// Ensure all required environment variables are set
if (!process.env.PORT) {
    throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}

if (!process.env.VIDEO_STORAGE_HOST) {
    throw new Error("Please specify the host name for the video storage microservice in variable VIDEO_STORAGE_HOST.");
}

if (!process.env.VIDEO_STORAGE_PORT) {
    throw new Error("Please specify the port number for the video storage microservice in variable VIDEO_STORAGE_PORT.");
}

if (!process.env.DBHOST) {
    throw new Error("Please specify the database host using environment variable DBHOST.");
}

if (!process.env.DBNAME) {
    throw new Error("Please specify the name of the database using environment variable DBNAME.");
}

const PORT = process.env.PORT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;

console.log(`Forwarding video requests to ${VIDEO_STORAGE_HOST}:${VIDEO_STORAGE_PORT}.`);

function main() {
    return mongodb.MongoClient.connect(DBHOST) // Connect to the database
        .then(client => {
            const db = client.db(DBNAME);
            const userVideosCollection = db.collection("user_videos"); // Access the user_videos collection

            app.get("/videos", (req, res) => {
                console.log("Received request for videos with userId:", req.query.userId);
                const userId = parseInt(req.query.userId); // Get userId from query parameters

                userVideosCollection.find({ userId: userId }).toArray() // Fetch all videos for the user
                    .then(videoRecords => {
                        if (videoRecords.length === 0) {
                            res.status(404).send("No videos found for this user.");
                            return;
                        }

                        const videoPaths = videoRecords.map(record => ({
                            videoId: record.videoId
                            
                        }));

                        res.status(200).json(videoPaths);
                    })
                    .catch(err => {
                        console.error("Failed to fetch user videos.");
                        console.error(err && err.stack || err);
                        res.sendStatus(500);
                    });
            });

            app.get("/video", (req, res) => {
                console.log("Received request for videos with userId:", req.query.userId);
                const userId = parseInt(req.query.userId); // Get userId from query parameters
                const videoId = req.query.videoId; // Get videoId from query parameters
            
                // Query the 'user_videos' collection to find the video matching userId and videoId
                userVideosCollection.findOne({ userId: userId, videoId: videoId })
                    .then(userVideoRecord => {
                        if (!userVideoRecord) {
                            res.status(404).send("No matching video found for this useraltogether not a a single video");
                            return;
                        }
            
                        const videoPath = userVideoRecord.videoId; // videoId now contains the path directly
                        console.log(`User ${userId} requested video ${videoId} with path ${videoPath}`);
            
                        // Forward the request to the video storage microservice
                        const forwardRequest = http.request(
                            {
                                host: VIDEO_STORAGE_HOST,
                                port: VIDEO_STORAGE_PORT,
                                path: `/video?path=${encodeURIComponent(videoPath)}`, // Use the videoPath
                                method: "GET",
                                headers: req.headers
                            },
                            forwardResponse => {
                                res.writeHeader(forwardResponse.statusCode, forwardResponse.headers);
                                forwardResponse.pipe(res);
                            }
                        );
            
                        req.pipe(forwardRequest);
                    })
                    .catch(err => {
                        console.error("Failed to find the video record.");
                        console.error(err && err.stack || err);
                        res.sendStatus(500);
                    });
            });
            
            // Start the HTTP server
            app.listen(PORT, () => {
                console.log(`Microservice listening on port ${PORT}.`);
            });
        });
}

main()
    .then(() => console.log("Microservice online of video streaming is online "))
    .catch(err => {
        console.error("Microservice of video streaming failed to start.");
        console.error(err && err.stack || err);
    });
