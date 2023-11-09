const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// MiddleWare

app.use(cors({
    origin: ['http://localhost:5173', 'https://swap-gardens-server.vercel.app', 'https://swapgardens.netlify.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(cookieParser());

// MiddleWare
// verify token
const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'not authorized' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        //error
        if (err) {
            return res.status(401).send({ message: 'unauthorized' })
        }
        //if valid token

        req.user = decoded;

        next()
    })

}



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
        const bookingCollection = client.db('swapDB').collection('booking');


        //auth related API
        app.post('/api/v1/auth/access-token', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })
                .send({ success: true })
        })


        // app.post('/logout', async (req, res) => {
        //     const user = req.body;
        //     res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        // })



        // Swap Related API
        app.get('/api/v1/swaps', async (req, res) => {

            const swap = req.query.swap;
            const search = req.query.search;
            const user = req.query.user;

            let query = {}

            if (swap) {
                query._id = new ObjectId(swap)
            }

            if (search) {
                query.name = search
            }

            if (user) {
                query.providerEmail = user
            }

            const result = await swapsCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/api/v1/myswaps', async (req, res) => {

            const userMail = req.query.user;

            // if (userMail !== req.user.email) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }

            let query = {}

            if (userMail) {
                query.providerEmail = userMail
            }

            const result = await swapsCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/api/v1/user/add-swap', async (req, res) => {
            const swap = req.body;
            const result = await swapsCollection.insertOne(swap)
            res.send(result)
        })

        app.put('/api/v1/user/update-swap/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedSwap = req.body;

            const swap = {
                $set: {
                    name: updatedSwap.name,
                    image: updatedSwap.image,
                    userName: updatedSwap.userName,
                    userEmail: updatedSwap.userEmail,
                    swapLocation: updatedSwap.swapLocation,
                    price: updatedSwap.price,
                    description: updatedSwap.description,
                }
            }

            const result = await swapsCollection.updateOne(filter, swap, options)
            res.send(result)
        })

        app.delete('/api/v1/user/delete-swap/:swapId', async (req, res) => {
            const id = req.params.swapId;
            const query = { _id: new ObjectId(id) }
            const result = await swapsCollection.deleteOne(query)
            res.send(result)
        })


        //Booking related API

        app.get('/api/v1/bookings', async (req, res) => {

            const user = req.query.user;

            let query = {}

            if (user) {
                query.userEmail = user
            }

            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })


        app.post('/api/v1/user/booking', async (req, res) => {
            const swap = req.body;
            const result = await bookingCollection.insertOne(swap)
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