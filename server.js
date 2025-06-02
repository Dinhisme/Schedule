import express from 'express';
import dotenv from 'dotenv';
import stripe from 'stripe';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

// Trang chủ
app.get('', (req, res) => {
    res.sendFile('/login.html', { root: "public" });
});

app.get('/home', (req, res) => {
    res.sendFile('/home.html', { root: "public" });
});

app.get('/login', (req, res) => {
    res.sendFile('/login.html', { root: "public" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('LAN access: http://172.16.0.99:' + PORT);
});

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), '/public/data/data.json');

// Helper: đọc file data.json
function readUsers() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// Helper: ghi file data.json
function writeUsers(users) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// API đăng ký
app.post('/api/register', (req, res) => {
    const { username, password, departments } = req.body;
    if (!username || !password || !departments) return res.status(400).json({ error: 'Thiếu thông tin' });
    const users = readUsers();
    if (users[username]) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
    users[username] = { password, departments };
    writeUsers(users);
    res.json({ success: true });
});

// API đăng nhập
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    if (users[username] && users[username].password === password) {
        res.json({ success: true, departments: users[username].departments });
    } else {
        res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
});

const SCHEDULE_FILE = path.join(process.cwd(), 'public', 'data', 'schedule.json');

// Helper: đọc file schedule.json
function readSchedules() {
    try {
        const data = fs.readFileSync(SCHEDULE_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// Helper: ghi file schedule.json
function writeSchedules(schedules) {
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedules, null, 2), 'utf8');
}

// API lưu lịch trực (dạng tổng hợp)
app.post('/api/save-schedule', (req, res) => {
    const { username, weekKey, schedule } = req.body;
    if (!username || !weekKey || !Array.isArray(schedule)) {
        return res.status(400).json({ error: 'Thiếu thông tin!' });
    }
    const schedules = readSchedules();
    if (!schedules[username]) schedules[username] = { weeks: {} };
    if (!schedules[username].weeks) schedules[username].weeks = {};
    schedules[username].weeks[weekKey] = schedule;
    writeSchedules(schedules);
    res.json({ success: true });
});

// API tải lịch trực (dạng tổng hợp)
app.post('/api/load-schedule', (req, res) => {
    const { username, weekKey } = req.body;
    if (!username || !weekKey) return res.status(400).json({ error: 'Thiếu thông tin!' });
    const schedules = readSchedules();
    const user = schedules[username];
    if (!user || !user.weeks || !user.weeks[weekKey]) return res.json({ schedule: [] });
    res.json({ schedule: user.weeks[weekKey] });
});


// API lấy toàn bộ lịch trực
app.get('/api/all-schedules', (req, res) => {
    const schedules = readSchedules();
    res.json(schedules);
});

function getCurrentWeekKey(date = new Date()) {
    const year = date.getFullYear();
    const week = getISOWeekNumber(date);
    return `${year}-${week}`;
}
function getISOWeekNumber(date) {
    const tmp = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    tmp.setDate(tmp.getDate() - dayNr + 3);
    const firstThursday = tmp.valueOf();
    tmp.setMonth(0, 1);
    if (tmp.getDay() !== 4) {
        tmp.setMonth(0, 1 + ((4 - tmp.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - tmp) / 604800000);
}
