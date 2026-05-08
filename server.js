const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
    origin: '*', // Change this to your frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());

// Routes
const homeroute = require('./routes/home');
const voiceroute = require('./routes/voice')

app.use('/', homeroute);
app.use('/voice', voiceroute);

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', function () {
    console.log('Server is running on port ' + PORT);
});