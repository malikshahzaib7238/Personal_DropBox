// const express = require("express");
// const mongodb = require("mongodb");

// const app = express();
// app.use(express.json());

// const PORT = process.env.PORT || 6000;
// const DBHOST = process.env.DBHOST;
// const DBNAME = process.env.DBNAME;
// const MAX_STORAGE = parseInt(process.env.MAX_STORAGE);
// const ALERT_THRESHOLD = parseInt(process.env.ALERT_THRESHOLD);

// let db, userStorageCollection;

// // Connect to MongoDB
// mongodb.MongoClient.connect(DBHOST, { useUnifiedTopology: true })
//     .then(client => {
//         db = client.db(DBNAME);
//         userStorageCollection = db.collection("user_storage");
//         console.log("Connected to MongoDB for storage management.");
//     })
//     .catch(err => {
//         console.error("Failed to connect to MongoDB:", err);
//         process.exit(1);
//     });

// // Middleware to Check Storage
// app.post("/check-storage", async (req, res) => {
//     console.log("Received request to check storage.");
//     const { userId, videoSize } = req.body;

//     if (!userId || !videoSize) {
//         console.log("Missing 'userId' or 'videoSize' in request body.");
//         return res.status(400).send("Missing 'userId' or 'videoSize' in request body.");
//     }

//     console.log(`Checking storage for userId: ${userId} with video size: ${videoSize} bytes.`);

//     try {
//         // Fetch user storage data
//         console.log(`Fetching storage data for userId: ${userId}.`);
//         const userStorage = await userStorageCollection.findOne({ userId });

//         if (!userStorage) {
//             console.log(`No storage data found for userId: ${userId}. Assuming new user with 0 storage.`);
//         }

//         // Calculate total storage
//         const currentUsage = userStorage
//             ? Object.values(userStorage).reduce((sum, val) => (typeof val === "number" ? sum + val : sum), 0)
//             : 0;

//         console.log(`Current storage usage for userId ${userId}: ${currentUsage} bytes.`);

//         const newUsage = currentUsage + videoSize;
//         console.log(`New storage usage after adding video size: ${newUsage} bytes.`);

//         if (newUsage > MAX_STORAGE) {
//             console.log(`Storage limit exceeded for userId ${userId}. Total usage: ${newUsage} bytes.`);
//             return res.status(403).send("Storage limit exceeded. Please free up space.");
//         }

//         // Update user storage
//         console.log(`Updating storage data for userId: ${userId}. Adding video of size: ${videoSize} bytes.`);
//         const update = { $set: { [`video_${Date.now()}`]: videoSize } };
//         await userStorageCollection.updateOne({ userId }, update, { upsert: true });
//         console.log(`Storage data updated for userId ${userId}.`);

//         if (newUsage > ALERT_THRESHOLD) {
//             console.log(`Warning: UserId ${userId} has exceeded 80% of storage with ${newUsage} bytes.`);
//             res.status(200).send("Warning: You have exceeded 80% of your allocated storage.");
//         } else {
//             console.log(`Storage check passed for userId ${userId}. Total usage: ${newUsage} bytes.`);
//             res.status(200).send("Storage check passed.");
//         }

//     } catch (err) {
//         console.error("Error during storage check:", err);
//         res.status(500).send("Internal server error.");
//     }
// });

// // Start the server
// app.listen(PORT, () => {
//     console.log(`Storage Management Service running on port ${PORT}`);
// });

const express = require("express");
const mongodb = require("mongodb");
const http = require("http");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 6000;
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const MAX_STORAGE = parseInt(process.env.MAX_STORAGE);
const ALERT_THRESHOLD = parseInt(process.env.ALERT_THRESHOLD);

const USAGE_MONITORING_HOST = process.env.USAGE_MONITORING_HOST;
const USAGE_MONITORING_PORT = process.env.USAGE_MONITORING_PORT;

let db, userStorageCollection;

// Connect to MongoDB
mongodb.MongoClient.connect(DBHOST, { useUnifiedTopology: true })
    .then(client => {
        db = client.db(DBNAME);
        userStorageCollection = db.collection("user_storage");
        console.log("Connected to MongoDB for storage management.");
    })
    .catch(err => {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    });

    async function trackUsage(userId, size, action) {
        return new Promise((resolve, reject) => {
            const usageRequest = http.request(
                {
                    host: USAGE_MONITORING_HOST,
                    port: USAGE_MONITORING_PORT,
                    path: "/check-bandwidth",
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                },
                usageResponse => {
                    let data = "";
    
                    usageResponse.on("data", chunk => {
                        data += chunk;
                    });
    
                    usageResponse.on("end", () => {
                        if (usageResponse.statusCode === 200) {
                            console.log(`Usage tracking successful for userId ${userId}, action: ${action}, size: ${size}`);
                            resolve({ success: true, message: data });
                        } else if (usageResponse.statusCode === 429) {
                            console.error(`Bandwidth limit exceeded for userId ${userId}, action: ${action}, size: ${size}`);
                            resolve({ success: false, statusCode: 429, message: "Bandwidth limit exceeded." });
                        } else {
                            console.error(`Unexpected response for userId ${userId}, status code: ${usageResponse.statusCode}`);
                            resolve({ success: false, statusCode: usageResponse.statusCode, message: data });
                        }
                    });
                }
            );
    
            usageRequest.on("error", err => {
                console.error("Error connecting to Usage Monitoring Service:", err);
                reject(err);
            });
    
            // Correct payload format
            usageRequest.write(JSON.stringify({ userId, bandwidthUsed: size }));
            usageRequest.end();
        });
    }
    
// Middleware to Check Storage
app.post("/check-storage", async (req, res) => {
    console.log("Received request to check storage.");
    const { userId, videoSize } = req.body;

    if (!userId || !videoSize) {
        console.log("Missing 'userId' or 'videoSize' in request body.");
        return res.status(400).send("Missing 'userId' or 'videoSize' in request body.");
    }

    console.log(`Checking storage for userId: ${userId} with video size: ${videoSize} bytes.`);

    try {
        // Fetch user storage data
        console.log(`Fetching storage data for userId: ${userId}.`);
        const userStorage = await userStorageCollection.findOne({ userId });

        if (!userStorage) {
            console.log(`No storage data found for userId: ${userId}. Assuming new user with 0 storage.`);
        }

        // Calculate total storage
        const currentUsage = userStorage
            ? Object.values(userStorage).reduce((sum, val) => (typeof val === "number" ? sum + val : sum), 0)
            : 0;

        console.log(`Current storage usage for userId ${userId}: ${currentUsage} bytes.`);

        const newUsage = currentUsage + videoSize;
        console.log(`New storage usage after adding video size: ${newUsage} bytes.`);

        if (newUsage > MAX_STORAGE) {
            console.log(`Storage limit exceeded for userId ${userId}. Total usage: ${newUsage} bytes.`);
            return res.status(403).send("Storage limit exceeded. Please free up space.");
        }

        // Forward usage data to Usage Monitoring Service
        console.log(`Forwarding usage data to Usage Monitoring Service for userId ${userId}.`);
        const usageTrackingResult = await trackUsage(userId, videoSize, "upload");

        if (!usageTrackingResult.success) {
            if (usageTrackingResult.statusCode === 403) {
                console.error(`Daily upload limit reached for userId ${userId}.`);
                return res.status(403).send(usageTrackingResult.message);
            } else {
                console.error(`Failed to track usage: ${usageTrackingResult.message}`);
                return res.status(500).send("Failed to track usage. Please try again later.");
            }
        }

        // Update user storage
        console.log(`Updating storage data for userId: ${userId}. Adding video of size: ${videoSize} bytes.`);
        const update = { $set: { [`video_${Date.now()}`]: videoSize } };
        await userStorageCollection.updateOne({ userId }, update, { upsert: true });
        console.log(`Storage data updated for userId ${userId}.`);

        if (newUsage > ALERT_THRESHOLD) {
            console.log(`Warning: UserId ${userId} has exceeded 80% of storage with ${newUsage} bytes.`);
            res.status(200).send("Warning: You have exceeded 80% of your allocated storage.");
        } else {
            console.log(`Storage check passed for userId ${userId}. Total usage: ${newUsage} bytes.`);
            res.status(200).send("Storage check passed.");
        }

    } catch (err) {
        console.error("Error during storage check:", err);
        res.status(500).send("Internal server error.");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Storage Management Service running on port ${PORT}`);
});
