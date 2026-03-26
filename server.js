const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');

const app = express();

// الروابط لي مسموح ليهم يتصلو بالسيرفر ديال AZOUGUAGH
const allowedOrigins = [
    "https://azougar.vercel.app",   // الرابط لي خدام بيه دابا
    "https://azouguagh.vercel.app", // الرابط الجديد إلى بغيتي تخدم بيه
    "http://localhost:5173"         // باش تتيستي فبيسيك
];

// إعدادات CORS ديال Express (API)
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy: Origin not allowed'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);

// إعدادات CORS ديال Socket.io (الشات)
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// الاتصال بالداتابيز ديال Aiven
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {
    if (err) console.error('❌ Error MySQL:', err.message);
    else console.log('✅ Connected to Aiven MySQL');
});

// إعدادات تصاور البروفايل (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- ROUTES (المسارات) ---

// 1. تسجيل مستخدم جديد
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)";
        db.query(sql, [username, email, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ error: "Email or Username already exists" });
            res.status(201).json({ message: "User registered", userId: result.insertId });
        });
    } catch (err) {
        res.status(500).json({ error: "Error hashing password" });
    }
});

// 2. تسجيل الدخول
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM Users WHERE email = ?";
    
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0) {
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password_hash);
            
            if (isMatch) {
                res.json({ message: "Login success", user: user });
            } else {
                res.status(401).json({ error: "Wrong password" });
            }
        } else {
            res.status(404).json({ error: "User not found" });
        }
    });
});

// 3. جلب جميع الرومات
app.get('/api/rooms', (req, res) => {
    db.query("SELECT * FROM Rooms", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 4. إنشاء روم جديدة
app.post('/api/rooms', (req, res) => {
    const { name, admin_id } = req.body;
    const sqlRoom = "INSERT INTO Rooms (name, admin_id) VALUES (?, ?)";
    db.query(sqlRoom, [name, admin_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const roomId = result.insertId;
        const sqlMember = "INSERT INTO Room_Members (room_id, user_id, role, status) VALUES (?, ?, 'admin', 'approved')";
        db.query(sqlMember, [roomId, admin_id], (err2) => {
            res.json({ message: "Room created", roomId: roomId });
        });
    });
});

// 5. طلب انضمام لروم
app.post('/api/rooms/join', (req, res) => {
    const { room_id, user_id } = req.body;
    const sql = "INSERT INTO Room_Members (room_id, user_id, role, status) VALUES (?, ?, 'member', 'pending')";
    db.query(sql, [room_id, user_id], (err, result) => {
        if (err) return res.status(500).json({ error: "Already requested" });
        res.json({ message: "Request sent" });
    });
});

// 6. جلب الطلبات (للأدمين)
app.get('/api/rooms/:roomId/requests', (req, res) => {
    const { roomId } = req.params;
    const sql = "SELECT Room_Members.*, Users.username FROM Room_Members JOIN Users ON Room_Members.user_id = Users.id WHERE room_id = ? AND status = 'pending'";
    db.query(sql, [roomId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 7. رد الأدمين (قبول/رفض)
app.post('/api/rooms/requests/respond', (req, res) => {
    const { room_id, user_id, status } = req.body;
    const sql = "UPDATE Room_Members SET status = ? WHERE room_id = ? AND user_id = ?";
    db.query(sql, [status, room_id, user_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Request ${status}` });
    });
});

// 8. رفع صورة البروفايل
app.post('/api/upload-avatar', upload.single('avatar'), (req, res) => {
    const { userId } = req.body;
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    const sql = "UPDATE Users SET profile_pic = ? WHERE id = ?";
    db.query(sql, [imageUrl, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Image uploaded", imageUrl: imageUrl });
    });
});

// --- SOCKET.IO ---
io.on('connection', (socket) => {
    socket.on('join_room', (data) => {
        socket.join(data.roomId);
        socket.to(data.roomId).emit('user-connected', data.peerId);
    });

    socket.on('send_message', (data) => {
        socket.to(data.room).emit('receive_message', data);
    });

    socket.on('send_join_request', (data) => {
        io.to(data.roomId).emit('receive_join_request', data);
    });
});

// تشغيل السيرفر وحل الباب لـ Docker
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is listening on 0.0.0.0:${PORT}`);
});