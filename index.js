const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;


//middleware

app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5173'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());



//routes

app.get('/', (req, res) => {
    res.send('car doctor server running')
})

app.listen(port, () => {
    console.log(`server running on port ${port}`)
})




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uo3rphs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//our middleware

// const logger = (req, res, next) => {
//     console.log('called::::', req.host, req.originalUrl);
//     next();

// }

// const verifyToken = (req, res, next) => {
//     const token = req.cookies?.token;
//     console.log('value of token in middle ware', token);

//     if (!token) {
//         return res.status(401).send({ message: 'unauthorized' });
//     }
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
//         // err
//         if (err) {
//             console.log(err);
//             return res.status(401).send({ message: 'unauthorized' });
//         }

//         //decode

//         console.log('decode', decode);
//         req.user = decode;
//         next();

//     })


// }

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const serviceCollection = client.db("carDoctor").collection('services');
        const bookingCollection = client.db("carDoctor").collection('bookings');

        jwt
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log('user for token: ', user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            }).send({ success: true })

        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logout', user)
            res.clearCookie('token', { maxAge: 0 }).send({ success: true });
        })




        // services route
        app.get('/add',  async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);


        })

        app.get('/add/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const options = {

                // Include only the `title` and `imdb` fields in each returned document
                projection: { title: 1, price: 1, description: 1, img: 1 },
            };



            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        })



        //Bookings route
        app.post('/bookings', async (req, res) => {
            const booking = req.body;

            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        app.get('/bookings', async (req, res) => {
            console.log(req.query.email);
            console.log('from valid user', req.user)
            // if (req.query.email !== req.user?.email) {
            //     return res.status(403).send({ message: 'problem here' });
            // }

            // console.log('token::', req.cookies?.token);


            let query = {};
            if (req.query?.email) {
                query = { customer_Eamil: req.query.email }
            }

            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })



        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const updateBooking = req.body;
            console.log(updateBooking);
            const updatedDoc = {
                $set: {
                    status: updateBooking.status
                },
            };
            const result = await bookingCollection.updateOne(query, updatedDoc);

            res.send(result);




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

