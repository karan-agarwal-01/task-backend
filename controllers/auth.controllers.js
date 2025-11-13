const User = require("../models/User");
const generateToken = require("../utils/generateToken");

exports.registerUser = async (req, res) => {   
    
    const {email, password} = req.body;
    
    if (!email || !password) {
        return res.status(400).json({message: 'Please enter all fields'});
    }

    const userExists = await User.findOne({ email })

    if (userExists) {
        return res.status(400).json({message: 'User already exits'});
    }

    const user = await User.create({email, password})

    if (user) {
        res.status(201).json({_id: user._id, email: user.email, token: generateToken(user._id)})
    } else {
        res.status(400).json({ message: 'Invalid user data' })
    }
}

exports.loginUser =  async (req, res) => {
    
    const { email, password } = req.body;

    const user = await User.findOne({ email })

    if (user && (await user.matchPassword(password))) {
        res.json({ _id: user._id, email: user.email, token: generateToken(user._id), onboarded: user.onboarded});
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
}