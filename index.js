const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// MiddleWare

app.use(cors());
app.use(express.json());

//DB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0viwxwm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const swapsCollection = client.db('swapDB').collection('swaps');

        app.get('/api/v1/swaps', async (req, res) => {
            const result = await swapsCollection.find().toArray();
            res.send(result);
        })

        app.post('/api/v1/user/add-swap', async (req, res) => {
            const swap = req.body;
            const result = await swapsCollection.insertOne(swap)
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Swap Gardens server is running')
})

app.listen(port, () => {
    console.log(`Swap Gardens is running on port: ${port}`);
})