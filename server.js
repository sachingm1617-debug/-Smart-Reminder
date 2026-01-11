const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CALENDARS_FILE = path.join(DATA_DIR, 'calendars.json');
const REMINDERS_FILE = path.join(DATA_DIR, 'reminders.json');

// Initialize data files
async function initializeData() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Create users file if it doesn't exist
        try {
            await fs.access(USERS_FILE);
        } catch {
            await fs.writeFile(USERS_FILE, JSON.stringify([]));
        }
        
        // Create calendars file if it doesn't exist
        try {
            await fs.access(CALENDARS_FILE);
        } catch {
            await fs.writeFile(CALENDARS_FILE, JSON.stringify([]));
        }
        
        // Create reminders file if it doesn't exist
        try {
            await fs.access(REMINDERS_FILE);
        } catch {
            await fs.writeFile(REMINDERS_FILE, JSON.stringify([]));
        }
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

// Helper functions to read/write data
async function readData(file) {
    try {
        const data = await fs.readFile(file, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${file}:`, error);
        return [];
    }
}

async function writeData(file, data) {
    try {
        await fs.writeFile(file, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing ${file}:`, error);
    }
}

// User routes
app.post('/api/users', async (req, res) => {
    try {
        const { name, email } = req.body;
        const users = await readData(USERS_FILE);
        
        const newUser = {
            id: uuidv4(),
            name,
            email,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        await writeData(USERS_FILE, users);
        
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await readData(USERS_FILE);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Calendar routes
app.post('/api/calendars', async (req, res) => {
    try {
        const { name, ownerId, sharedWith = [] } = req.body;
        const calendars = await readData(CALENDARS_FILE);
        
        const newCalendar = {
            id: uuidv4(),
            name,
            ownerId,
            sharedWith,
            createdAt: new Date().toISOString()
        };
        
        calendars.push(newCalendar);
        await writeData(CALENDARS_FILE, calendars);
        
        res.status(201).json(newCalendar);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create calendar' });
    }
});

app.get('/api/calendars/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const calendars = await readData(CALENDARS_FILE);
        
        // Get calendars owned by user or shared with user
        const userCalendars = calendars.filter(calendar => 
            calendar.ownerId === userId || 
            calendar.sharedWith.includes(userId)
        );
        
        res.json(userCalendars);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch calendars' });
    }
});

app.post('/api/calendars/:calendarId/share', async (req, res) => {
    try {
        const { calendarId } = req.params;
        const { userId } = req.body;
        const calendars = await readData(CALENDARS_FILE);
        
        const calendarIndex = calendars.findIndex(c => c.id === calendarId);
        if (calendarIndex === -1) {
            return res.status(404).json({ error: 'Calendar not found' });
        }
        
        // Add user to sharedWith array if not already there
        if (!calendars[calendarIndex].sharedWith.includes(userId)) {
            calendars[calendarIndex].sharedWith.push(userId);
            await writeData(CALENDARS_FILE, calendars);
        }
        
        res.json(calendars[calendarIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to share calendar' });
    }
});

// Reminder routes
app.post('/api/reminders', async (req, res) => {
    try {
        const { task, time, calendarId } = req.body;
        const reminders = await readData(REMINDERS_FILE);
        
        const newReminder = {
            id: uuidv4(),
            task,
            time,
            calendarId,
            createdAt: new Date().toISOString()
        };
        
        reminders.push(newReminder);
        await writeData(REMINDERS_FILE, reminders);
        
        res.status(201).json(newReminder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create reminder' });
    }
});

app.get('/api/reminders/:calendarId', async (req, res) => {
    try {
        const { calendarId } = req.params;
        const reminders = await readData(REMINDERS_FILE);
        
        const calendarReminders = reminders.filter(reminder => reminder.calendarId === calendarId);
        res.json(calendarReminders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});

app.delete('/api/reminders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let reminders = await readData(REMINDERS_FILE);
        
        reminders = reminders.filter(reminder => reminder.id !== id);
        await writeData(REMINDERS_FILE, reminders);
        
        res.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete reminder' });
    }
});

// Serve frontend files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize data and start server
initializeData().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});