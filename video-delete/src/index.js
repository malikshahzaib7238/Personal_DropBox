// const express = require("express");
// const http = require("http");
// const mongodb = require("mongodb");

// const app = express();

// if (!process.env.STORAGE_MANAGEMENT_HOST) {
//     console.error("STORAGE_MANAGEMENT_HOST is not set.");
//     throw new Error("Please specify the host for the storage management service using STORAGE_MANAGEMENT_HOST.");
// }
// if (!process.env.STORAGE_MANAGEMENT_PORT) {
//     console.error("STORAGE_MANAGEMENT_PORT is not set.");
//     throw new Error("Please specify the port for the storage management service using STORAGE_MANAGEMENT_PORT.");
// }
// if (!process.env.PORT) {
//     console.error("PORT is not set.");
//     throw new Error("Please specify the port for this microservice using PORT.");
// }
// if (!process.env.VIDEO_STORAGE_HOST) {
//     console.error("VIDEO_STORAGE_HOST is not set.");
//     throw new Error("Please specify the host for the video storage service using VIDEO_STORAGE_HOST.");
// }
// if (!process.env.VIDEO_STORAGE_PORT) {
//     console.error("VIDEO_STORAGE_PORT is not set.");
//     throw new Error("Please specify the port for the video storage service using VIDEO_STORAGE_PORT.");
// }
// if (!process.env.DBHOST) {
//     console.error("DBHOST is not set.");
//     throw new Error("Please specify the database host using DBHOST.");
// }
// if (!process.env.DBNAME) {
//     console.error("DBNAME is not set.");
//     throw new Error("Please specify the database name using DBNAME.");
// }

// const PORT = process.env.PORT;
// const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
// const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);
// const DBHOST = process.env.DBHOST;
// const DBNAME = process.env.DBNAME;
// const STORAGE_MANAGEMENT_HOST = process.env.STORAGE_MANAGEMENT_HOST;
// const STORAGE_MANAGEMENT_PORT = process.env.STORAGE_MANAGEMENT_PORT;

// console.log(`Forwarding delete requests to ${VIDEO_STORAGE_HOST}:${VIDEO_STORAGE_PORT}.`);

// function main() {
//     return mongodb.MongoClient.connect(DBHOST)
//         .then(client => {
//             const db = client.db(DBNAME);
//             const userVideosCollection = db.collection("user_videos");

//             app.use(express.json());
//             console.log("Express server initialized and MongoDB connection established.");

//             // Delete video request
//             app.delete("/delete", (req, res) => {
//                 console.log("Received DELETE request for video.");

//                 const userId = req.headers.userid;
//                 const videoId = req.headers.id;

//                 if (!userId || !videoId) {
//                     console.log("Missing 'userid' or 'id' header for video deletion.");
//                     return res.status(400).send("Missing 'userid' or 'id' header for video deletion.");
//                 }

//                 console.log(`Attempting to delete video with id ${videoId} for user ${userId}.`);

//                 // Step 1: Remove video metadata from the database
//                 userVideosCollection.deleteOne({ userId: parseInt(userId), videoId: videoId })
//                     .then(result => {
//                         if (result.deletedCount === 0) {
//                             console.log(`No video found in the database for user ${userId} with videoId ${videoId}.`);
//                             return res.status(404).send("Video not found in the database.");
//                         }

//                         console.log(`Deleted video metadata for user ${userId}, video ${videoId}`);

//                         // Step 2: Forward delete request to storage service
//                         forwardDelete(videoId, res);
//                     })
//                     .catch(err => {
//                         console.error("Failed to delete video metadata from database:", err);
//                         res.sendStatus(500);
//                     });
//             });

//             function forwardDelete(videoId, res) {
//                 console.log(`Forwarding delete request for video ${videoId} to video storage service.`);

//                 const deleteRequest = http.request(
//                     {
//                         host: VIDEO_STORAGE_HOST,
//                         port: VIDEO_STORAGE_PORT,
//                         path: `/delete`,
//                         method: "DELETE",
//                         headers: {
//                             "id": videoId
//                         }
//                     },
//                     deleteResponse => {
//                         let data = "";

//                         deleteResponse.on("data", chunk => {
//                             data += chunk;
//                         });

//                         deleteResponse.on("end", () => {
//                             if (deleteResponse.statusCode === 200) {
//                                 console.log(`Video file ${videoId} deleted successfully from storage.`);
//                                 res.status(200).send("Video deleted successfully.");
//                             } else {
//                                 console.error(`Failed to delete video file ${videoId} from storage. Status code: ${deleteResponse.statusCode}`);
//                                 res.status(deleteResponse.statusCode).send(data);
//                             }
//                         });
//                     }
//                 );

//                 deleteRequest.on("error", err => {
//                     console.error("Error forwarding delete request to storage service:", err);
//                     res.sendStatus(500);
//                 });

//                 deleteRequest.end();
//             }

//             app.listen(PORT, () => {
//                 console.log(`Delete microservice listening on port ${PORT}.`);
//             });
//         })
//         .catch(err => {
//             console.error("Failed to connect to the database:", err);
//         });
// }

// main()
//     .then(() => console.log("Delete microservice is online."))
//     .catch(err => {
//         console.error("Failed to start the delete microservice.");
//         console.error(err && err.stack || err);
//     });


const express = require("express");
const http = require("http");
const mongodb = require("mongodb");
const cors = require("cors"); // Import CORS middleware

const app = express();

app.use(cors());  // Allows all origins, you can customize if needed


// Environment variable checks
if (!process.env.USAGE_MONITORING_HOST) {
    console.error("USAGE_MONITORING_HOST is not set.");
    throw new Error("Please specify the host for the usage monitoring service using USAGE_MONITORING_HOST.");
}
if (!process.env.USAGE_MONITORING_PORT) {
    console.error("USAGE_MONITORING_PORT is not set.");
    throw new Error("Please specify the port for the usage monitoring service using USAGE_MONITORING_PORT.");
}
if (!process.env.PORT) {
    console.error("PORT is not set.");
    throw new Error("Please specify the port for this microservice using PORT.");
}
if (!process.env.VIDEO_STORAGE_HOST) {
    console.error("VIDEO_STORAGE_HOST is not set.");
    throw new Error("Please specify the host for the video storage service using VIDEO_STORAGE_HOST.");
}
if (!process.env.VIDEO_STORAGE_PORT) {
    console.error("VIDEO_STORAGE_PORT is not set.");
    throw new Error("Please specify the port for the video storage service using VIDEO_STORAGE_PORT.");
}
if (!process.env.DBHOST) {
    console.error("DBHOST is not set.");
    throw new Error("Please specify the database host using DBHOST.");
}
if (!process.env.DBNAME) {
    console.error("DBNAME is not set.");
    throw new Error("Please specify the database name using DBNAME.");
}

const PORT = process.env.PORT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const USAGE_MONITORING_HOST = process.env.USAGE_MONITORING_HOST;
const USAGE_MONITORING_PORT = process.env.USAGE_MONITORING_PORT;

console.log(`Forwarding delete requests to ${VIDEO_STORAGE_HOST}:${VIDEO_STORAGE_PORT}.`);

function main() {
    return mongodb.MongoClient.connect(DBHOST)
        .then(client => {
            const db = client.db(DBNAME);
            const userVideosCollection = db.collection("user_videos");
            const videoSizesCollection = db.collection("video_sizes"); 
            app.use(express.json());
            console.log("Express server initialized and MongoDB connection established.");
            async function getVideoSizeFromDatabase(videoId) {
                try {
                    const result = await videoSizesCollection.findOne({ videoId: videoId });
                    if (result) {
                        return result.size;  // Return the size of the video in bytes
                    }
                    throw new Error('Video size not found');
                } catch (err) {
                    console.error("Error retrieving video size from database:", err);
                    throw err;  // Propagate error
                }
            }
            // Delete video request
            app.delete("/delete", async(req, res) => {
                console.log("Received DELETE request for video.");
                const userId = req.headers.userid;
                const videoId = req.headers.id;

                const fileSize = await getVideoSizeFromDatabase(videoId);
                console.log(`Retrieved video size: ${fileSize} bytes for videoId ${videoId}`);

                if (!userId || !videoId) {
                    console.log("Missing 'userid' or 'id' header for video deletion.");
                    return res.status(400).send("Missing 'userid' or 'id' header for video deletion.");
                }

                console.log(`Attempting to delete video with id ${videoId} for user ${userId}.`);

                // Step 1: Remove video metadata from the database
                userVideosCollection.deleteOne({ userId: parseInt(userId), videoId: videoId })
                    .then(result => {
                        if (result.deletedCount === 0) {
                            console.log(`No video found in the database for user ${userId} with videoId ${videoId}.`);
                            return res.status(404).send("Video not found in the database.");
                        }

                        console.log(`Deleted video metadata for user ${userId}, video ${videoId}`);

                        // Step 2: Forward delete request to storage service
                        forwardDeleteToStorage(videoId, userId, res);
                    })
                    .catch(err => {
                        console.error("Failed to delete video metadata from database:", err);
                        res.sendStatus(500);
                    });
            });

            // Forward delete request to video storage service
            async function forwardDeleteToStorage(videoId, userId, res) {
                console.log(`Forwarding delete request for video ${videoId} to video storage service.`);
                const fileSize = await getVideoSizeFromDatabase(videoId);
                console.log(`Retrieved video size: ${fileSize} bytes for videoId ${videoId}`);
                const deleteRequest = http.request(
                    {
                        host: VIDEO_STORAGE_HOST,
                        port: VIDEO_STORAGE_PORT,
                        path: `/delete`,
                        method: "DELETE",
                        headers: {
                            "id": videoId
                        }
                    },
                    deleteResponse => {
                        let data = "";

                        deleteResponse.on("data", chunk => {
                            data += chunk;
                        });

                        deleteResponse.on("end", () => {
                            if (deleteResponse.statusCode === 200) {
                                console.log(`Video file ${videoId} deleted successfully from storage.`);

                                forwardToUsageMonitoring(userId, fileSize,res);
                            } else {
                                console.error(`Failed to delete video file ${videoId} from storage. Status code: ${deleteResponse.statusCode}`);
                                res.status(deleteResponse.statusCode).send(data);
                            }
                        });
                    }
                );

                deleteRequest.on("error", err => {
                    console.error("Error forwarding delete request to storage service:", err);
                    res.sendStatus(500);
                });

                deleteRequest.end();
            }

            function forwardToUsageMonitoring(userId, bandwidthUsed, res) {
                console.log(`Notifying usage monitoring service for user ${userId}, bandwidth used: ${bandwidthUsed} bytes.`);
            
                const usageRequest = http.request(
                    {
                        host: USAGE_MONITORING_HOST,
                        port: USAGE_MONITORING_PORT,
                        path: `/check-bandwidth`,
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        }
                    },
                    usageResponse => {
                        let data = "";
            
                        usageResponse.on("data", chunk => {
                            data += chunk;
                        });
            
                        usageResponse.on("end", () => {
                            if (usageResponse.statusCode === 200) {
                                console.log(`Usage monitoring service updated successfully for user ${userId}.`);
                                res.status(200).send("Operation successful.");
                            } else if (usageResponse.statusCode === 429) {
                                console.error(`Bandwidth limit exceeded for user ${userId}.`);
                                res.status(429).send("Bandwidth limit exceeded. Operation not allowed.");
                            } else {
                                console.error(`Unexpected response from usage monitoring service for user ${userId}.`);
                                res.status(usageResponse.statusCode).send(data);
                            }
                        });
                    }
                );
            
                usageRequest.on("error", err => {
                    console.error("Error notifying usage monitoring service:", err);
                    res.sendStatus(500);
                });
            
                // Correct payload format
                usageRequest.write(JSON.stringify({ userId, bandwidthUsed }));
                usageRequest.end();
            }
            

            app.listen(PORT, () => {
                console.log(`Delete microservice listening on port ${PORT}.`);
            });
        })
        .catch(err => {
            console.error("Failed to connect to the database:", err);
        });
}

main()
    .then(() => console.log("Delete microservice is online."))
    .catch(err => {
        console.error("Failed to start the delete microservice.");
        console.error(err && err.stack || err);
    });
