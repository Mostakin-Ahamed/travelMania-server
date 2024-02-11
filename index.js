const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mostakinahamed.fo1obhn.mongodb.net/?retryWrites=true&w=majority`;

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
         
        const servicesCollection = client.db("TravelManiaDB").collection("Services")
        const guidesCollection= client.db("TravelManiaDB").collection("Guides")
        const bookedCollection= client.db("TravelManiaDB").collection("BookedTours")
        const wishCollection= client.db("TravelManiaDB").collection("WishList")
        const userCollection= client.db("TravelManiaDB").collection("Users")

        //jwt related api
        app.post('/jwt',async(req, res)=>{
            const user= req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
                expiresIn: '1H'
            });
            res.send({token});
            
        })

        //middlewares
        const verifyToken =(req , res, next)=>{
            if(!req.headers.authorization){
                return res.status(401).send({message: 'Forbidden Access!'})
            }

            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
                if(err){
                    return res.status(401).send({message: 'Forbidden Access!'})
                }
                req.decoded= decoded;
                next();
            })

        }
        


        app.get('/allTours', async(req, res)=>{
            const result = await servicesCollection.find().toArray();
            res.send(result)
        })
        app.get('/allGuides', async(req, res)=>{
            const result = await guidesCollection.find().toArray();
            res.send(result)
        })

        app.get('/details/:id', async(req, res)=>{
            const id = req.params.id;
            
            const query = {_id: new ObjectId(id)}
            const result = await servicesCollection.findOne(query);
            res.send(result)
        })

        app.get('/users/admin/:email', verifyToken, async(req, res)=>{
            const email= req.params.email;
            if(email !== req.decoded.email){
                return res.status(403).send({message: 'unauthorized access'})
            }
            const query = {email: email}
            const user = await userCollection.findOne(query);
            let admin = false;
            if(user){
                admin = user?.role ==='admin'
            }
            res.send({admin})
        })
        app.get('/users/guide/:email', verifyToken, async(req, res)=>{
            const email= req.params.email;
            if(email !== req.decoded.email){
                return res.status(403).send({message: 'unauthorized access'})
            }
            const query = {email: email}
            const user = await userCollection.findOne(query);
            let guide = false;
            if(user){
                guide = user?.role ==='guide'
            }
            res.send({guide})
        })
        app.get('/bookings',async(req, res)=>{
            const email = req.query.email;
            let query ={};
            if(req.query?.email){
                query={email: email}
            }
            const result = await bookedCollection.find(query).toArray()
            res.send(result);
        })
        app.get('/wishList',async(req, res)=>{
            const email = req.query.email;
            let query ={};
            if(req.query?.email){
                query={email: email}
            }
            const result = await wishCollection.find(query).toArray()
            res.send(result);
        })

        app.post('/users', async(req, res)=>{
            const user = req.body;
            const query = {email: user.email}
            const existingUser= await userCollection.findOne(query);
            if(existingUser){
                return res.send({message: 'Email already exists!'})
            }
            const result = await userCollection.insertOne(user);
            res.send(result);

        })

        app.post('/allTours', async(req, res)=>{
            const tour = req.body;
            const result= await servicesCollection.insertOne(tour);
            res.send(result)
        })

        app.get('/users',verifyToken, async(req, res)=>{
            const result = await userCollection.find().toArray();
            res.send(result)
        })

        app.delete('/users/:id', async(req, res)=>{
            const id=req.params.id;
            const query ={_id: new ObjectId(id)};
            const result = await userCollection.deleteOne(query)
            res.send(result);
        })

        app.patch('/users/admin/:id', async(req, res)=>{
            const id = req.params.id;
            const filter ={_id: new ObjectId(id)};
            const updatedRole = {
                $set:{
                    role:'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedRole)
            res.send(result)
        })
        app.patch('/users/guide/:id', async(req, res)=>{
            const id = req.params.id;
            const filter ={_id: new ObjectId(id)};
            const updatedRole = {
                $set:{
                    role:'guide'
                }
            }
            const result = await userCollection.updateOne(filter, updatedRole)
            res.send(result)
        })
        app.patch('/users/user/:id', async(req, res)=>{
            const id = req.params.id;
            const filter ={_id: new ObjectId(id)};
            const updatedRole = {
                $set:{
                    role:'user'
                }
            }
            const result = await userCollection.updateOne(filter, updatedRole)
            res.send(result)
        })

        app.delete('/wishList/:id',async(req, res)=>{
            const id=req.params.id;
            const query = {_id:new ObjectId(id)}
            const result = await wishCollection.deleteOne(query);
            res.send(result)
        })

        // app.post(, async (req, res)=>{
        //     const bookTour =req.body;
        //     console.log(bookTour);
        //     // const result = await bookedCollection.insertOne(cartItem);
        //     // res.send(result)
        // })
        app.post('/bookTour', async(req, res)=>{
            const booking = req.body;
            const result = await bookedCollection.insertOne(booking)
            res.send(result)
          })

        app.post('/wishList', async(req,res)=>{
            const wishList= req.body;
            const result = await wishCollection.insertOne(wishList);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Travel Mania Is Running')
})

app.listen(port, () => {
    console.log(`Travel Mania server is running on server ${port}`);
})
