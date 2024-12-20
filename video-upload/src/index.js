const express = require("express");
const http = require("http");
const mongodb = require("mongodb");
const cors = require("cors"); // Import CORS middleware

const app = express();

// Enable CORS for all routes
app.use(cors());  // Allows all origins, you can customize if needed

if(!process.env.STORAGE_MANAGEMENT_HOST){
    throw new Error ("Please specify the env for storage management ");
}
if(!process.env.STORAGE_MANAGEMENT_PORT){
    throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}
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
const STORAGE_MANAGEMENT_HOST=process.env.STORAGE_MANAGEMENT_HOST;
const STORAGE_MANAGEMENT_PORT=process.env.STORAGE_MANAGEMENT_PORT;
var warningbool=false;

console.log(`Forwarding video requests to ${VIDEO_STORAGE_HOST}:${VIDEO_STORAGE_PORT}.`);

function main() {
    return mongodb.MongoClient.connect(DBHOST) // Connect to the database
        .then(client => {
            const db = client.db(DBNAME);
            const userVideosCollection = db.collection("user_videos"); // Access the user_videos collection
            const videoSizesCollection = db.collection("video_sizes"); // Access the video_sizes collection

            app.use(express.json());
            app.use(express.urlencoded({ extended: true }));

            // Forward video upload request to the second service and insert into MongoDB
            app.post("/upload", (req, res) => {
                const userId = req.headers.userid; // Get the userId from the headers
                const videoId = req.headers.id;    // Get the videoId from the headers
                const contentType = req.headers["content-type"];  // Get content type from headers
                const videoSize = parseInt(req.headers["content-length"]); // Get the size of the video

                if (!userId || !videoId) {
                    return res.status(400).send("Missing 'userid' or 'id' header for video upload.");
                }
                const videoSizeRecord = {
                    videoId: videoId,
                    size: videoSize,
                    userId: userId,
                    timestamp: new Date()
                };
                videoSizesCollection.insertOne(videoSizeRecord)
                .then(() => {
                    console.log(`Inserted video size for videoId ${videoId}, size ${videoSize} bytes.`);

                    // Step 2: Forward video upload request to the storage service (not shown)
                })
                .catch(err => {
                    console.error("Failed to insert video size:", err);
                    res.sendStatus(500);
                });

                const forwardStorageCheck = http.request(
                    {
                    host: STORAGE_MANAGEMENT_HOST,
                    port: STORAGE_MANAGEMENT_PORT,
                    path: '/check-storage',
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
                storageResponse => {
                    let data = "";
            
                    storageResponse.on("data", chunk => {
                        data += chunk;
                    });
            
                    storageResponse.on("end", () => {
                        if (storageResponse.statusCode === 403) {
                            return res.status(403).send(data); // Stop upload if storage limit exceeded
                        }
            
                        if (storageResponse.statusCode === 200 && data.includes("Warning")) {
                            console.warn("80% storage exceeded warning:", data);
                            warningbool=true;
                        }
            
                        // Proceed with video upload
                        forwardUpload();
                    });
                }
            );
            
            forwardStorageCheck.write(
                JSON.stringify({
                    userId,
                    videoSize: parseInt(req.headers["content-length"]),
                })
            );
            
            forwardStorageCheck.end();

            function forwardUpload() {
                // Insert the video details into the 'user_videos' collection
                userVideosCollection.insertOne({ userId: parseInt(userId), videoId: videoId })
                    .then(() => {
                        console.log(`Inserted video record for user ${userId}: ${videoId}`);
                    })
                    .catch(err => {
                        console.error("Failed to insert video record into database:", err);
                        res.sendStatus(500);
                    });

                // Forward the request to the second service for upload
                const forwardRequest = http.request(
                    {
                        host: VIDEO_STORAGE_HOST,
                        port: VIDEO_STORAGE_PORT,
                        path: '/upload',
                        method: 'POST',
                        headers: {
                            ...req.headers,  // Forward all the original headers
                        }
                    },
                    forwardResponse => {
                        // Handle the response from the second service
                        res.writeHeader(forwardResponse.statusCode, forwardResponse.headers);
                        forwardResponse.pipe(res, { end: true });
                        if (warningbool) {
                            res.write("Warning: You have exceeded 80% of your allocated storage.");
                        }
                    }
                );

                // Pipe the request body (video data) to the second service's upload endpoint
                req.pipe(forwardRequest)
                    .on('error', err => {
                        console.error("Error forwarding the upload request:", err);
                        res.sendStatus(500);
                    });
                }
            });

            // Start the HTTP server
            app.listen(PORT, () => {
                console.log(`Microservice listening on port ${PORT}.`);
            });
        });
}

main()
    .then(() => console.log("Microservice online for video upload is online"))
    .catch(err => {
        console.error("Microservice for video upload failed to start.");
        console.error(err && err.stack || err);
    });
