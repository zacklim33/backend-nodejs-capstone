const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});


//middleware to handle uploaded files from user
const upload = multer({ 
    storage: storage, 
    limits: {fileSize: 5 * 1024 * 1024 } // 5MB limit
 });


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        //Step 2: task 1 - Get connection from db 
        const db = await connectToDatabase();

        //Step 2: task 2 - Connect to collection
        const collection = await db.collection("secondChanceItems");

        //Step 2: task 3 - Get all records in collection
        const secondChanceItems = await collection.find({}).toArray();

        //Step 2: task 4 - return records as JSON
        res.json(secondChanceItems);
        
        
        
    } catch (e) {
        logger.error('oops something went wrong', e)
        next(e);
    }
});


// Add a new item
router.post('/', upload.single('file'), async(req, res,next) => {
    try {

        //Step 3: task 1 - connect to database
        const db = await connectToDatabase();

        //Step 3: task 2 - get 2ndChanceItems collections
        const collection = await db.collection("secondChanceItems");
        
        //Step 3: task 3 - Get data of new item from request body
        const new2ndChanceItem = req.body;

        //Step 3: task 4 - Assign ID to new item 
        //get last ID in collection, by sorting in descending order
        const last2ndChanceItems = await collection
           .find({})
           .sort({id:-1}) //sort by elements
           .limit(1)
           .toArray();     

        //assign id to new item
        new2ndChanceItem.id = (parseInt(last2ndChanceItems[0].id)+1).toString();

        //Step 3: task 5 - set date to new item, in seconds
        new2ndChanceItem.date_added = parseInt(Math.floor(Date.now() / 1000) ) ;         

        //Step 3: task 6 - upload image into images directory
        if (req.file) {
            new2ndChanceItem.image=`/images/${req.file.originalname}`;
            /* Old definiton of image
            new2ndChanceItem.image = {
                filename: req.file.originalname,
                path: path.join(directoryPath, req.file.originalname),
                mimetype: req.file.mimetype,
                size: req.file.size,
                uploadDate: new Date()
            };*/
        } else {
            // Optional: Handle case where no file was uploaded
            logger.info('No file uploaded with the request');
        }


        //Step 3: task 7 - add new item into database
        const addResult = await collection.insertOne(new2ndChanceItem);        

        //return 201 HTTP code for successful operations
        res.status(201).json(addResult.insertedId);
        //TypeError: Cannot read properties of undefined (reading '0')

    } catch (e) {
        logger.error(e.message);
        next(e);
    }
});



// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        //Step 4: task 1 - connect to MongoDB
        const db = await connectToDatabase();

        //Step 4: task 2 - Access specific DB
        const collection = await db.collection("secondChanceItems")

        //Step 4: task 3 - find item from collection
        const id = req.params.id;
        specificItem = await collection.findOne({"id":id});
        
        //Step 4: task 4 - return JSON object
        if (!specificItem) {
            return res.status(404).send("No item found");
        } else{
            return res.json(specificItem);
        }


    } catch (e) {
        next(e);
    }
});


// Update and existing item
router.put('/:id', async(req, res,next) => {
    try {
        //Step 5: task 1 - connect to MongoDB
        const db = await connectToDatabase();

        //Step 5: task 2 - assign collection
        const collection = await db.collection("secondChanceItems");

        //Step 5: task 3 - check item exists in collection
        const id = req.params.id;
        const specificItem = await collection.findOne({"id":id});
        if ( !specificItem) return res.status(404).send("No item is found");
        
        //Step 5: task 4 - update items specific attributes
        secondChanceItem.category = req.body.category;
        secondChanceItem.condition = req.body.condition;
        secondChanceItem.age_days = req.body.age_days;
        secondChanceItem.description = req.body.description;
        secondChanceItem.age_years = Number((secondChanceItem.age_days/365).toFixed(1));
        secondChanceItem.updatedAt = new Date();

        const updatepreloveItem = await collection.findOneAndUpdate(
            { id },
            { $set: secondChanceItem },
            { returnDocument: 'after' }
        );

        //Step 5: task 5 - send confirmation
        if (updatepreloveItem) {
            res.json({"uploaded": "success"});
        } else {
            res.json({"uploaded":"failed"});
        }


    } catch (e) {
        next(e);
    }
});


// Delete an existing item
router.delete('/:id', async(req, res,next) => {
    try {
        //Step 6: task 1 - connect to MongoDB
        const db = await connectToDatabase();

        //Step 6: task 2 - access specific collection
        const collection = await db.collection("secondChanceItems");

        //Step 6: task 3 - locate item based on id
        const id = req.params.id;
        const specificItem = await collection.findOne({"id":id});
        
        //Step 6: task 4 - delete item if it exist in database
        if (!specificItem) {
            res.status(404).send("No item found. Cannot delete");
        } else{
            const delStatus = await collection.delete({"id":id});
            res.json({"deleted":"success"});
        }
        
    } catch (e) {
        next(e);
    }
});

module.exports = router;
