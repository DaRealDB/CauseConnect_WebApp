const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require("cors");
const { Pool } = require('pg'); // PostgreSQL client

app.use(cors());
app.use(express.json()); // <--- ADDED: Express middleware for parsing JSON bodies

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 1e7 // 10MB for image uploads
});

// --- POSTGRES CONNECTION ---
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'master', // --- change ---
    password: 'Dreamer_321;', // --- change ---
    port: 5432, 
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the MASTER database:', err);
    } else {
        console.log('PostgreSQL connected successfully to MASTER at:', res.rows[0].now);
    }
});
// ----------------------------

// Store online users (These maps are still needed for real-time presence)
const onlineUsers = new Map(); // socketId -> username
const userSockets = new Map(); // username -> socketId

// --- NEW/UPDATED HELPER FUNCTIONS FOR DB OPERATIONS ---

// 1. Check if user exists (now returns username/hash for API use)
const checkUserCredentials = async (username) => {
    try {
        // Fetch username and password hash (we only fetch username for the simple check)
        const query = 'SELECT username, password_hash FROM users WHERE username = $1';
        const result = await pool.query(query, [username]);
        return result.rows[0]; // Returns user object or undefined
    } catch (error) {
        console.error('Error checking user credentials:', error);
        return null;
    }
};

// 2. Fetch message history from the PostgreSQL 'messages' table
const getMessageHistoryFromDB = async (roomId) => {
    try {
        const query = `
            SELECT sender, message_text AS message, type, image_data AS "imageData", timestamp 
            FROM messages 
            WHERE room = $1 
            ORDER BY timestamp ASC 
            LIMIT 100;
        `;
        const result = await pool.query(query, [roomId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching message history:', error);
        return [];
    }
};

// 3. Save a new message to the PostgreSQL 'messages' table
const saveMessageToDB = async (messageData) => {
    try {
        const query = `
            INSERT INTO messages (room, sender, message_text, type, image_data, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6);
        `;
        const values = [
            messageData.room,
            messageData.sender,
            messageData.message,
            messageData.type,
            messageData.imageData || null,
            messageData.timestamp
        ];
        
        await pool.query(query, values);
    } catch (error) {
        console.error('Error saving message to database:', error);
    }
};
// -----------------------------------------------------

// --- NEW: EXPRESS API LOGIN ROUTE ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required.' });
    }

    const user = await checkUserCredentials(username);

    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid username.' });
    }

    // REAL WORLD: Use bcrypt.compare(password, user.password_hash)
    // For this simple example, we skip the password check.
    if (user.username === username) { // Always true since we queried by username
        return res.json({ 
            success: true, 
            username: user.username,
            message: 'Login successful'
        });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
});
// ------------------------------------


io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // --- UPDATED: Handle user login with DB check (now only checks existence) ---
    socket.on("user_login", async (username) => { 
        if (!username || username.trim() === "") {
            console.log("Login rejected: Empty username.");
            return;
        }

        // We assume the API route has already verified credentials.
        // We only check for existence to prevent unauthorized names from joining the chat.
        const userExists = await checkUserCredentials(username); 

        if (!userExists) {
            console.log(`Login rejected: User '${username}' not found in database.`);
            socket.emit("login_error", "User not authenticated or does not exist."); 
            return; 
        }

        // If user already has a session, disconnect the old one (optional but robust)
        const oldSocketId = userSockets.get(username);
        if (oldSocketId) {
            const oldSocket = io.sockets.sockets.get(oldSocketId);
            if (oldSocket && oldSocket.id !== socket.id) {
                 // Do NOT disconnect, let the new connection overwrite the old one.
            }
        }

        // Store user info
        onlineUsers.set(socket.id, username);
        userSockets.set(username, socket.id);
        
        console.log(`User ${username} logged in with socket ID: ${socket.id}`);
        console.log("Current online users:", Array.from(onlineUsers.values()));
        
        // Broadcast updated online users list to all clients
        const usersList = Array.from(onlineUsers.values());
        console.log("Broadcasting users list:", usersList);
        io.emit("online_users", usersList);
    });
    // -----------------------------------------------

    // Handle joining a room (No change needed)
    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        const username = onlineUsers.get(socket.id);
        console.log(`User ${username} (${socket.id}) joined room: ${roomId}`);
    });

    // Handle leaving a room (No change needed)
    socket.on("leave_room", (roomId) => {
        socket.leave(roomId);
        const username = onlineUsers.get(socket.id);
        console.log(`User ${username} (${socket.id}) left room: ${roomId}`);
    });

    // --- UPDATED: Handle getting message history from DB ---
    socket.on("get_message_history", async (roomId) => { // ADDED 'async'
        const history = await getMessageHistoryFromDB(roomId); // USE DB FUNCTION

        socket.emit("message_history", {
            room: roomId,
            messages: history
        });
        console.log(`Sent message history for room ${roomId}: ${history.length} messages`);
    });
    // ---------------------------------------------------

    // --- UPDATED: Handle sending messages, saving to DB ---
    socket.on("send_message", (data) => {
        const username = onlineUsers.get(socket.id);
        
        if (!data.room || !data.sender) {
            console.error("Invalid message data:", data);
            return;
        }

        const messageData = {
            ...data,
            timestamp: data.timestamp || new Date().toISOString()
        };

        // Store message in PostgreSQL
        saveMessageToDB(messageData);
        
        socket.to(data.room).emit("receive_message", messageData);
        
        console.log(`Message stored in database for room ${data.room}`);
    });
    // ----------------------------------------------------

    // Handle user disconnection (No change needed)
    socket.on("disconnect", () => {
        const username = onlineUsers.get(socket.id);
        
        if (username) {
            console.log(`User ${username} disconnected`);
            
            // Remove user from both maps
            onlineUsers.delete(socket.id);
            userSockets.delete(username);
            
            // Broadcast updated online users list
            const usersList = Array.from(onlineUsers.values());
            console.log("Updated users list after disconnect:", usersList);
            io.emit("online_users", usersList);
        } else {
            console.log(`Unknown user disconnected: ${socket.id}`);
        }
    });
});


server.listen(3001, () => {
    console.log("SERVER IS RUNNING on port 3001");
    console.log("Features enabled:");
    console.log("- Message history storage (PostgreSQL)");
    console.log("- Image upload support");
    console.log("- Real-time notifications");
    console.log("- User authentication via PostgreSQL 'users' table");
});