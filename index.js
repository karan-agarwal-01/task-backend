const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth.routes');
const onboardingRoutes = require('./routes/onboarding.routes.js');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT;

mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB Connected!')).catch(err => console.error(err));

app.use(cors());

app.use(express.json());

app.get('/', () => {
    console.log('Hare Krishna');
})

app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);

app.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
})