const express = require("express");
const http = require("http");
const mongodb = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // In production, always use environment variable

app.use(express.json());
app.use(cors());

// Environment variable checks
const requiredEnvVars = ['PORT', 'DBHOST', 'DBNAME'];
requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        throw new Error(`Please specify ${envVar} environment variable.`);
    }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// Registration endpoint
// Registration endpoint
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const client = await mongodb.MongoClient.connect(process.env.DBHOST);
        const db = client.db(process.env.DBNAME);
        const usersCollection = db.collection("users");

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            client.close();
            return res.status(400).json({ message: "Username already exists" });
        }

        // Get the highest user ID in the collection
        const highestUser = await usersCollection.findOne({}, { sort: { userId: -1 } });

        // Parse userId as a number, defaulting to 0 if no users exist
        const newUserId = highestUser && highestUser.userId
            ? parseInt(highestUser.userId, 10) + 1
            : 1;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = {
            userId: newUserId, // Store as a number
            username,
            password: hashedPassword,
            createdAt: new Date()
        };

        await usersCollection.insertOne(newUser);

        // Generate JWT token
        const token = jwt.sign({ userId: newUserId, username }, JWT_SECRET, { expiresIn: '24h' });

        client.close();
        res.status(201).json({
            message: "Registration successful",
            token,
            userId: newUserId,
            username
        });

    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
// Authentication endpoint
app.post("/authenticate", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    try {
        const client = await mongodb.MongoClient.connect(process.env.DBHOST);
        const db = client.db(process.env.DBNAME);
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({ username });

        if (!user) {
            client.close();
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            client.close();
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.userId, username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        client.close();
        res.status(200).json({
            message: "Login successful",
            token,
            userId: user.userId,
            username: user.username
        });

    } catch (err) {
        console.error("Authentication error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Protected route example
app.get("/user-profile", verifyToken, async (req, res) => {
    try {
        const client = await mongodb.MongoClient.connect(process.env.DBHOST);
        const db = client.db(process.env.DBNAME);
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne(
            { userId: req.user.userId },
            { projection: { password: 0 } }
        );

        client.close();
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

const PORT = process.env.PORT || 4007;
app.listen(PORT, () => {
    console.log(`Authentication service is running on port ${PORT}`);
});
//////////////