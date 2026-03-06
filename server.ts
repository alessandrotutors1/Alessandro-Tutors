import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("tutors.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    type TEXT CHECK(type IN ('individual', 'group')) NOT NULL,
    description TEXT,
    is_booked INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    availability_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (availability_id) REFERENCES availability(id)
  );
`);

// Default content
const defaultSettings = [
  ['mission_statement', 'Empowering students to reach their full potential through personalized and engaging tutoring sessions.'],
  ['experience', 'Over 5 years of experience in mathematics, science, and test preparation. Helped hundreds of students improve their grades and confidence.'],
  ['pricing_info', 'Individual Sessions: $50/hr\\nGroup Sessions: $30/hr per student'],
  ['profile_image', 'https://picsum.photos/seed/tutor/400/400']
];

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
defaultSettings.forEach(([key, value]) => insertSetting.run(key, value));

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // --- API Routes ---

  // Auth Middleware (Simple password check)
  const checkAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const password = req.headers['x-admin-password'];
    const storedPassword = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password') as { value: string } | undefined;
    
    if (!storedPassword) {
      return res.status(401).json({ error: 'Admin password not set' });
    }
    
    if (password === storedPassword.value) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  // Check if password is set
  app.get('/api/auth/status', (req, res) => {
    try {
      const storedPassword = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password');
      res.json({ isSet: !!storedPassword });
    } catch (error) {
      console.error('Error checking auth status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Set initial password
  app.post('/api/auth/setup', (req, res) => {
    try {
      const { password } = req.body;
      if (!password || password.trim().length === 0) {
        return res.status(400).json({ error: 'Password cannot be empty' });
      }

      const storedPassword = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password');
      if (storedPassword) {
        return res.status(400).json({ error: 'Password already set' });
      }
      
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('admin_password', password);
      res.json({ success: true });
    } catch (error) {
      console.error('Error setting up password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all settings
  app.get('/api/settings', (req, res) => {
    const rows = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
    const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    res.json(settings);
  });

  // Update settings (Admin)
  app.post('/api/settings', checkAuth, (req, res) => {
    const { key, value } = req.body;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    res.json({ success: true });
  });

  // Availability
  app.get('/api/availability', (req, res) => {
    const slots = db.prepare('SELECT * FROM availability WHERE is_booked = 0').all();
    res.json(slots);
  });

  app.post('/api/availability', checkAuth, (req, res) => {
    const { start_time, end_time, type, description } = req.body;
    db.prepare('INSERT INTO availability (start_time, end_time, type, description) VALUES (?, ?, ?, ?)').run(start_time, end_time, type, description);
    res.json({ success: true });
  });

  app.delete('/api/availability/:id', checkAuth, (req, res) => {
    db.prepare('DELETE FROM availability WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Bookings
  app.get('/api/bookings', checkAuth, (req, res) => {
    const bookings = db.prepare(`
      SELECT b.*, a.start_time, a.end_time, a.type, a.description
      FROM bookings b
      JOIN availability a ON b.availability_id = a.id
      ORDER BY a.start_time ASC
    `).all();
    res.json(bookings);
  });

  app.post('/api/book', async (req, res) => {
    const { availability_id, user_name, user_email } = req.body;
    
    const slot = db.prepare('SELECT * FROM availability WHERE id = ? AND is_booked = 0').get(availability_id) as any;
    if (!slot) {
      return res.status(400).json({ error: 'Slot not available' });
    }

    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO bookings (availability_id, user_name, user_email) VALUES (?, ?, ?)').run(availability_id, user_name, user_email);
      db.prepare('UPDATE availability SET is_booked = 1 WHERE id = ?').run(availability_id);
    });
    transaction();

    // Send Email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: 'alessandrotutors1@gmail.com',
        subject: `New Tutoring Booking: ${user_name}`,
        text: `You have a new booking!
        
Name: ${user_name}
Email: ${user_email}
Time: ${slot.start_time} - ${slot.end_time}
Type: ${slot.type}
Description: ${slot.description}
        `,
      };

      // Only send if credentials are provided and not placeholders, otherwise log it
      const isPlaceholder = process.env.SMTP_USER?.includes('your-email') || process.env.SMTP_PASS?.includes('your-app-password');
      
      if (process.env.SMTP_USER && process.env.SMTP_PASS && !isPlaceholder) {
        await transporter.sendMail(mailOptions);
      } else {
        console.log('--- MOCK EMAIL LOG (SMTP NOT CONFIGURED) ---');
        console.log(`To: alessandrotutors1@gmail.com`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(mailOptions.text);
        console.log('--------------------------------------------');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    }

    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
