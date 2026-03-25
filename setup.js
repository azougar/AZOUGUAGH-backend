const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true // هادي باش نقدرو نكرييو كاع الجداول فدقة وحدة
});

db.connect((err) => {
    if (err) throw err;
    console.log('✅ Connected to Aiven MySQL');

    const createTables = `
        CREATE TABLE IF NOT EXISTS Users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            profile_pic VARCHAR(255) DEFAULT 'https://via.placeholder.com/40'
        );

        CREATE TABLE IF NOT EXISTS Rooms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            admin_id INT,
            FOREIGN KEY (admin_id) REFERENCES Users(id)
        );

        CREATE TABLE IF NOT EXISTS Room_Members (
            id INT AUTO_INCREMENT PRIMARY KEY,
            room_id INT,
            user_id INT,
            role VARCHAR(50),
            status VARCHAR(50),
            FOREIGN KEY (room_id) REFERENCES Rooms(id),
            FOREIGN KEY (user_id) REFERENCES Users(id)
        );
    `;

    db.query(createTables, (err, result) => {
        if (err) throw err;
        console.log('🎉 الجداول تكرياو بنجاح فـ Aiven!');
        process.exit(); // باش يسد الملف ملي يسالي
    });
});