const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth.routes');
const onboardingRoutes = require('./routes/onboarding.routes.js');
const cors = require('cors');
const passport = require("./config/passport");
const session = require('express-session');
const { default: axios } = require('axios');
const todosRoutes = require('./routes/todos.routes');

dotenv.config(); 

const app = express();
const PORT = process.env.PORT;

mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB Connected!')).catch(err => console.error(err));

app.use(cors({ origin: ["http://localhost:5173", process.env.FRONTEND_URL], credentials: true }));

app.use(
    session({
        secret: "secret123",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

app.get('/', (req, res) => {
    console.log('Hare Krishna');
    res.status(200).send('Server is running!')
})

app.get("/proxy/image", async (req, res) => {
    try {
        const imageUrl = req.query.url;
        const response = await axios.get(imageUrl, {
            responseType: "arraybuffer",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
                "Referer": "https://www.linkedin.com/",
                "Sec-Fetch-Dest": "image",
                "Sec-Fetch-Mode": "no-cors",
                "Sec-Fetch-Site": "cross-site"
            }
        });
        res.setHeader("Content-Type", response.headers["content-type"]);
        res.send(response.data);
    } catch (error) {
        console.log(error)
        res.status(500).send("Failed to load image");
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/todos', todosRoutes);

app.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
})