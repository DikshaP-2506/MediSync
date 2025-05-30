# MediSync - Medication Management System

MediSync is a comprehensive medication management system that helps users track their medications, receive reminders, and manage their healthcare routine effectively. This project was created during the 'INVICTUS 2025' hackathon.

## Features

### 1. Medication Management
- Add medications manually or using OCR
- Set medication schedules and reminders
- Track medication inventory
- Receive notifications for missed doses
- Low stock alerts

### 2. OCR Medication Detection
- Upload images of medication packages
- Automatic medication name detection
- Easy scheduling of detected medications

### 3. Smart Notifications
- SMS reminders for medication time
- Low stock notifications

### 4. Interactive Games
- Memory Game
- Maze Game
- Whack-a-Mole

### 5. Pharmacy Locator
- Find nearby pharmacies

### 6. AI Chatbot Assistant
- 24/7 medication support
- Quick answers to medication queries

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Chart.js for progress visualization

### Backend
- Node.js
- Express.js
- PostgreSQL (Database)
- Sequelize (ORM)

### External Services
- Twilio (SMS notifications)
- Tesseract.js (OCR)
- OpenStreetMap API (Pharmacy locations)

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/medisync.git
cd medisync
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
DB_NAME=medisync
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM_NUMBER=your_twilio_number
```

4. Start the Server:
```bash
node server.js
```
5. Run the Project:
```bash
run signup.html
```

## API Endpoints

### Medication Management
- `POST /add-medication` - Add a new medication
- `POST /add-medication-ocr` - Add medication using OCR
- `POST /mark-taken` - Mark medication as taken
- `GET /api/pharmacies` - Get nearby pharmacies

## Acknowledgments

- OpenStreetMap for pharmacy location data
- Twilio for SMS services
- Tesseract.js for OCR capabilities
- INVICTUS 2025 Hackathon for providing the platform to create this project
