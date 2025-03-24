// registeration endpoint
require('dotenv').config();
const express = require('express');
const connectToDatabase = require('../models/db');
const bcrypt = require('bcrypt');
const router = express.Router();
const jwt = require('jsonwebtoken');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET; 


router.post('/register', async (req, res) => {
    try {
        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
        const db = await connectToDatabase();

        // Task 2: Access MongoDB `users` collection
        const collection = await db.collection("users");
        
        // Task 3: Check if user credentials already exists in the database and throw an error if they do
        let query = req.body;
        user = await collection.findOne({email: query.email});
        if(user) {
            logger.ERROR('Email already exists in DB');
        }

        // Task 4: Create a hash to encrypt the password so that it is not readable in the database
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password, salt);

        // Task 5: Insert the user into the database
        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        });


        // Task 6: Create JWT authentication if passwords match with user._id as payload
        const payload = { user: {id: newUser.insertedId, }, };
        const authtoken = jwt.sign(payload, JWT_SECRET, {expiresIn: '1h'}); //token expires in 1 hour
                
        // Task 7: Log the successful registration using the logger
        logger.info('User registered successfully');

        // Task 8: Return the user email and the token as a JSON
        res.json({authtoken, email: req.body.email});



    } catch (e) {
         return res.status(500).send('Internal server error');
    }
});



router.post('/login', async (req, res) => {
    try {
        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
        const db = await connectToDatabase();
        
        console.log('[DEBUG] JWT_SECRET:', process.env.JWT_SECRET); // Add this in authRoutes.js

        // Task 2: Access MongoDB `users` collection
        const collection = await db.collection("users");
        const count = await collection.countDocuments();
        console.log(`DB collection.count: ${count}`);

        // Task 3: Check for user credentials in database
        let theUser = await collection.findOne({email: req.body.email });
        if(!theUser) {
            logger.info("No user is found with email");
            return res.status(404).send("No user is found with email");
        }

        console.log(`theUser is found: ${req.body.email}`);

        // Task 4: Check if the password matches the encrypted password and send appropriate message on mismatch
        let result = await bcrypt.compare(req.body.password,theUser.password);
        if(!result) {
            logger.error('Passwords do not match');
            return res.status(404).json({error: 'Wrong password'});
        }
                
        
        // Task 5: Fetch user details from a database
        const userName = theUser.firstName;
        const userEmail = theUser.email;
        console.log(`user details ${userName}, ${userEmail}`); 

        // Task 6: Create JWT authentication if passwords match with user._id as payload
        const payload = { user: {id: theUser._id.toString(), } };
        const authtoken = jwt.sign(payload, JWT_SECRET, {expiresIn: '1h'}); //token expires in 1 hour

        console.log(`authtoken: ${authtoken}`); 
        
        res.json({authtoken, userName, userEmail });
        // Task 7: Send appropriate message if the user is not found
    } catch (e) {
        logger.error(e.message);
         return res.status(500).send('Internal server error');

    }
});










module.exports = router; 