const express = require("express");
const mongodb = require("mongodb");

const app = express();
app.use(express.json());

// Environment variable checks
if (!process.env.PORT) {
    console.error("PORT is not set.");
    throw new Error("Please specify the port for this microservice using PORT.");
}
if (!process.env.DBHOST) {
    console.error("DBHOST is not set.");
    throw new Error("Please specify the database host using DBHOST.");
}
if (!process.env.DBNAME) {
    console.error("DBNAME is not set.");
    throw new Error("Please specify the database name using DBNAME.");
}
if (!process.env.DAILY_BANDWIDTH_LIMIT) {
    console.error("DAILY_BANDWIDTH_LIMIT is not set.");
    throw new Error("Please specify the daily bandwidth limit in bytes using DAILY_BANDWIDTH_LIMIT.");
}

const PORT = process.env.PORT;
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const DAILY_BANDWIDTH_LIMIT = parseInt(process.env.DAILY_BANDWIDTH_LIMIT);

function main() {
    return mongodb.MongoClient.connect(DBHOST)
        .then(client => {
            const db = client.db(DBNAME);
            const usageCollection = db.collection("user_bandwidth");

            console.log("Connected to MongoDB and initialized usage monitoring service.");

            /**
             * Endpoint to check and update bandwidth usage
             */
            // app.post("/check-bandwidth", (req, res) => {
            //     const { userId, bandwidthUsed } = req.body;

            //     if (!userId || typeof bandwidthUsed !== "number") {
            //         console.log("Missing or invalid 'userId' or 'bandwidthUsed' in request body.");
            //         return res.status(400).send("Invalid 'userId' or 'bandwidthUsed'.");
            //     }

            //     const today = new Date().toISOString().split("T")[0];

            //     // Update and check bandwidth usage
            //     usageCollection.findOneAndUpdate(
            //         { userId: parseInt(userId), date: today },
            //         { $inc: { bandwidthUsed: bandwidthUsed } },
            //         { upsert: true, returnDocument: "after" }
            //     )
            //         .then(result => {
            //             const totalBandwidthUsed = result.value ? result.value.bandwidthUsed : bandwidthUsed;

            //             if (totalBandwidthUsed > DAILY_BANDWIDTH_LIMIT) {
            //                 console.log(`User ${userId} exceeded daily bandwidth limit. Total: ${totalBandwidthUsed} bytes.`);
            //                 return res.status(429).send("Bandwidth limit exceeded.");
            //             }

            //             console.log(`User ${userId} is within the bandwidth limit. Total: ${totalBandwidthUsed} bytes.`);
            //             res.status(200).send("Bandwidth usage is within the limit.");
            //         })
            //         .catch(err => {
            //             console.error("Error updating or checking bandwidth usage:", err);
            //             res.sendStatus(500);
            //         });
            // });


            app.post("/check-bandwidth", async (req, res) => {
                const { userId, bandwidthUsed } = req.body;
            
                if (!userId || typeof bandwidthUsed !== "number") {
                    console.log("Missing or invalid 'userId' or 'bandwidthUsed' in request body.");
                    return res.status(400).send("Invalid 'userId' or 'bandwidthUsed'.");
                }
            
                const today = new Date().toISOString().split("T")[0];
            
                try {
                    // Fetch current bandwidth usage for the user on the given day
                    const currentUsage = await usageCollection.findOne({ userId: parseInt(userId), date: today });
            
                    const existingBandwidth = currentUsage ? currentUsage.bandwidthUsed : 0; // Default to 0 if no record exists
                    const updatedBandwidth = existingBandwidth + bandwidthUsed; // Add the new usage
            
                    // Check against the daily bandwidth limit
                    if (updatedBandwidth > DAILY_BANDWIDTH_LIMIT) {
                        console.log(`User ${userId} exceeded daily bandwidth limit. Total: ${updatedBandwidth} bytes.`);
                        await usageCollection.updateOne(
                            { userId: parseInt(userId), date: today },
                            { $set: { bandwidthUsed: updatedBandwidth } },
                            { upsert: true }
                        );
                        return res.status(429).send("Bandwidth limit exceeded.");
                    }
            
                    // Update the bandwidth usage in the database
                    await usageCollection.updateOne(
                        { userId: parseInt(userId), date: today },
                        { $set: { bandwidthUsed: updatedBandwidth } },
                        { upsert: true }
                    );
            
                    console.log(`User ${userId} is within the bandwidth limit. Total: ${updatedBandwidth} bytes.`);
                    res.status(200).send("Bandwidth usage is within the limit.");
                } catch (err) {
                    console.error("Error updating or checking bandwidth usage:", err);
                    res.sendStatus(500);
                }
            });
            
            app.listen(PORT, () => {
                console.log(`Usage Monitoring Microservice listening on port ${PORT}.`);
            });
        })
        .catch(err => {
            console.error("Failed to connect to the database:", err);
        });
}

main()
    .then(() => console.log("Usage Monitoring Microservice is online."))
    .catch(err => {
        console.error("Failed to start the Usage Monitoring Microservice.");
        console.error(err && err.stack || err);
    });
