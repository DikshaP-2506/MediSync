require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Sequelize } = require("sequelize");
const axios = require("axios");
const cron = require("node-cron");
const twilio = require("twilio");
const multer = require("multer");
const { createWorker } = require("tesseract.js");
const path = require("path");
const { Pool } = require('pg');
const Tesseract = require('tesseract.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// PostgreSQL Connection
const sequelize = new Sequelize(
    process.env.DB_NAME || 'medisync',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'Diksha@1823',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        }
    }
);

// Test the connection
sequelize.authenticate()
    .then(() => console.log('PostgreSQL Connected Successfully'))
    .catch(err => console.error('PostgreSQL Connection Error:', err));

// Define Medication Model
const Medication = sequelize.define('Medication', {
    medName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    medTime: {
        type: Sequelize.STRING,
        allowNull: false
    },
    medQuantity: {
        type: Sequelize.STRING
    },
    phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false
    },
    caregiverNumber: {
        type: Sequelize.STRING,
        allowNull: false
    },
    isTaken: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
});

// Sync the model with the database
sequelize.sync()
    .then(() => console.log('Database synchronized'))
    .catch(err => console.error('Error synchronizing database:', err));

// Twilio Setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to Send SMS to User
const sendSMSToUser = async (to, body) => {
    try {
        const message = await client.messages.create({
            from: process.env.TWILIO_FROM_NUMBER,
            to: process.env.TO_NUMBER,
            body: body,
        });
        console.log("SMS Sent to User:", message.sid);
    } catch (error) {
        console.error("Error sending SMS to User:", error.message);
    }
};

const client2 = twilio(process.env.TWILIO_ACCOUNT_SID2, process.env.TWILIO_AUTH_TOKEN2);

// Function to Send SMS to Caregiver
const sendSMSToCaregiver = async (to, body) => {
    try {
        const message = await client2.messages.create({
            from: process.env.TWILIO_FROM_NUMBER2,
            to: process.env.TO_NUMBER2,
            body: body,
        });
        console.log("SMS Sent to Caregiver:", message.sid);
    } catch (error) {
        console.error("Error sending SMS to Caregiver:", error.message);
    }
};

// Store Scheduled Reminders
let scheduledReminders = [];

// API to Add Medication & Schedule Reminder
app.post("/add-medication", async (req, res) => {
    const { medName, medTime, medQuantity, phoneNumber, caregiverNumber } = req.body;

    if (!medName || !medTime || !phoneNumber || !caregiverNumber) {
        return res.status(400).json({ message: "Missing required fields!" });
    }

    try {
        // Save medication to database
        const medication = await Medication.create({
            medName,
            medTime,
            medQuantity,
            phoneNumber,
            caregiverNumber
        });

        // Convert medTime (HH:MM) to cron format
        const [hours, minutes] = medTime.split(":");
        const cronTime = `${minutes} ${hours} * * *`;

        // Schedule Initial SMS to User
        const initialJob = cron.schedule(cronTime, () => {
            sendSMSToUser(phoneNumber, `Hello! It's time to take your medication: ${medName} at ${medTime}`);
        }, { timezone: "Asia/Kolkata" });

        // Schedule Follow-up SMS to Caregiver after 30 minutes
        const followUpJob = cron.schedule(cronTime, () => {
            setTimeout(async () => {
                // Check if the medication was marked as taken
                const med = await Medication.findOne({
                    where: {
                        medName,
                        medTime,
                        phoneNumber,
                        isTaken: false
                    }
                });

                if (med) {
                    const message = `Alert: ${phoneNumber} has not taken their medication (${medName}) at ${medTime}. Please check on them.`;
                    await sendSMSToCaregiver(caregiverNumber, message);
                }
            }, 2 * 60 * 1000); // 2 minutes delay
        }, { timezone: "Asia/Kolkata" });

        // Store the reminder jobs
        scheduledReminders.push({ medName, medTime, initialJob, followUpJob });

        res.json({ message: `Reminder set for ${medName} at ${medTime}!` });
    } catch (error) {
        console.error('Error adding medication:', error);
        res.status(500).json({ message: "Error adding medication" });
    }
});

// API to Mark Medication as Taken
app.post("/mark-taken", async (req, res) => {
    const { medName, medTime, phoneNumber } = req.body;

    if (!medName || !medTime || !phoneNumber) {
        return res.status(400).json({ message: "Missing required fields!" });
    }

    try {
        // Update medication status in database
        await Medication.update(
            { isTaken: true },
            {
                where: {
                    medName,
                    medTime,
                    phoneNumber
                }
            }
        );

        // Find and cancel the follow-up job for this medication
        const reminderIndex = scheduledReminders.findIndex(
            (reminder) => reminder.medName === medName && reminder.medTime === medTime
        );

        if (reminderIndex !== -1) {
            const reminder = scheduledReminders[reminderIndex];
            reminder.followUpJob.stop(); // Stop the follow-up job
            scheduledReminders.splice(reminderIndex, 1); // Remove the reminder from the list
            console.log(`Follow-up reminder for ${medName} at ${medTime} canceled.`);
        }

        res.json({ message: `Medication ${medName} marked as taken!` });
    } catch (error) {
        console.error('Error marking medication as taken:', error);
        res.status(500).json({ message: "Error marking medication as taken" });
    }
});

// API to Fetch Nearby Pharmacies
app.get("/api/pharmacies", async (req, res) => {
    try {
        const { lat, lon } = req.query; // Get user location
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=pharmacy](around:5000,${lat},${lon});out;`;

        const response = await axios.get(overpassUrl);
        res.json(response.data.elements);
    } catch (error) {
        res.status(500).json({ error: "Error fetching pharmacies" });
    }
});

// API to Add Medication using OCR
app.post("/add-medication-ocr", upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded!" });
    }

    const { phoneNumber, caregiverNumber, medTime, medQuantity } = req.body;

    if (!phoneNumber || !caregiverNumber || !medTime) {
        return res.status(400).json({ message: "Missing required fields!" });
    }

    try {
        // Initialize Tesseract worker
        const worker = await createWorker();
        
        // Perform OCR on the uploaded image
        const { data: { text } } = await worker.recognize(req.file.path);
        await worker.terminate();

        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);

        // Extract medication name from OCR text
        // This is a simple implementation - you might want to enhance this logic
        const medName = text.split('\n')[0].trim();

        if (!medName) {
            return res.status(400).json({ message: "Could not detect medication name from image!" });
        }

        // Save medication to database
        const medication = await Medication.create({
            medName,
            medTime,
            medQuantity,
            phoneNumber,
            caregiverNumber
        });

        // Convert medTime (HH:MM) to cron format
        const [hours, minutes] = medTime.split(":");
        const cronTime = `${minutes} ${hours} * * *`;

        // Schedule Initial SMS to User
        const initialJob = cron.schedule(cronTime, () => {
            sendSMSToUser(phoneNumber, `Hello! It's time to take your medication: ${medName} at ${medTime}`);
        }, { timezone: "Asia/Kolkata" });

        // Schedule Follow-up SMS to Caregiver
        const followUpJob = cron.schedule(cronTime, () => {
            setTimeout(async () => {
                const med = await Medication.findOne({
                    where: {
                        medName,
                        medTime,
                        phoneNumber,
                        isTaken: false
                    }
                });

                if (med) {
                    const message = `Alert: ${phoneNumber} has not taken their medication (${medName}) at ${medTime}. Please check on them.`;
                    await sendSMSToCaregiver(caregiverNumber, message);
                }
            }, 2 * 60 * 1000);
        }, { timezone: "Asia/Kolkata" });

        // Store the reminder jobs
        scheduledReminders.push({ medName, medTime, initialJob, followUpJob });

        res.json({ 
            message: `Medication detected and reminder set for ${medName} at ${medTime}!`,
            detectedMedication: medName
        });
    } catch (error) {
        console.error('Error processing image:', error);
        // Clean up the uploaded file in case of error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "Error processing image" });
    }
});

// OCR Medication Endpoint
app.post('/api/add-medication-ocr', upload.single('medicationImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Perform OCR on the uploaded image
        const result = await Tesseract.recognize(
            req.file.path,
            'eng',
            { logger: m => console.log(m) }
        );

        // Extract medication name from OCR result
        const medicationName = result.data.text.trim();

        // Save to database
        const query = `
            INSERT INTO medications (name, user_id, schedule, dosage, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *;
        `;

        const values = [
            medicationName,
            req.body.userId, // Make sure to send userId from frontend
            req.body.schedule || 'daily',
            req.body.dosage || '1'
        ];

        const dbResult = await pool.query(query, values);

        res.json({
            success: true,
            medication: dbResult.rows[0],
            ocrResult: medicationName
        });

    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ error: 'Failed to process medication image' });
    }
});

// Get all medications for a user
app.get('/api/medications/:userId', async (req, res) => {
    try {
        const query = 'SELECT * FROM medications WHERE user_id = $1 ORDER BY created_at DESC';
        const result = await pool.query(query, [req.params.userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to fetch medications' });
    }
});

// Default Route
app.get("/", (req, res) => {
    res.send("Server is running");
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});