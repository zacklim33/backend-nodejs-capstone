require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');

// MongoDB connection URL with authentication options
let url = `${process.env.MONGO_URL}`;
const dbName = 'secondChance';
const collectionName = 'secondChanceItems';


// connect to database and insert data into the collection
async function loadData() {
    const client = new MongoClient(url);

    try {
        // Connect to the MongoDB client
        await client.connect();
        console.log("Connected successfully to server");

        const dbInstance = client.db(dbName);
        return dbInstance;

    } catch (error) {
        console.error("Cannot connect to DB");
        
    } finally {
        // Close the connection
        await client.close();
    }
} 