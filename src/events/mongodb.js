require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connect_db = async () => {
    try {
        await mongoose.connect(process.env.mongo, {
            useNewUrlParser: true, // Fixed typo here
            useUnifiedTopology: true,
        });
        console.log('Yo, we connected to MongoDB!');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1); // Exit the process if the connection fails
    }
};

// Define the user schema
const userSchema = new mongoose.Schema({
    discordId: String,
    suspended_by: String,
    suspender_id: String,
    started_on: String,
    expires_on: String,
    in_days: String,
    in_ms: String,
});

// Create the User model
const User = mongoose.model('Suspension', userSchema);

// Export the User model and connect_db function
module.exports = {
    User,
    connect_db,
};