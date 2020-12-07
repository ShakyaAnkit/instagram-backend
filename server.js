import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Pusher from 'pusher';
import dbModel from './dbModel.js';

//app config
const app = express();
const port = process.env.PORT || 8080

var Pusher = require('pusher');

const pusher = new Pusher({
  appId: '1084618',
  key: 'b14e6ae5fa14c5e323b5',
  secret: 'a08d411aef0d5a339ed7',
  cluster: 'eu',
  usetls: true,
});



//middlewares
app.use(express.json())
app.use(cors())

//DB config
const connection_url = 'mongodb+srv://admin:e5jKR45REhSM527@cluster0.qnist.mongodb.net/instaDB?retryWrites=true&w=majority'
mongoose.connect(connection_url,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

mongoose.connection.once('open',()=>{
    console.log('DB Connected');

    const changeStream = mongoose.connection.collection('posts').watch();
    changeStream.on('change', (change)=>{
        console.log('Change Triggered on pusher...')
        console.log(change)
        console.log('End of Change')

        if (change.operationType === 'insert'){
            console.log('Triggering Pusher ***IMG UPLOAD***')

            const postDetails = change.fullDocument;
            pusher.trigger('posts','inserted',{
                user : postDetails.user,
                caption : postDetails.caption,
                image : postDetails.image
            })

        }else{
            console.log('Unknown trigger from Pusher')
        }
    })
})

//api routes
app.get("/", (req,res) => res.status(200).send('hello world 123'));

app.post('/upload', (req,res)=>{
    //this will let us push a post
    const body = req.body;

    dbModel.create(body, (err, data) => {
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(201).send(data);
        }
    })


})

app.get('/sync', (req,res)=>{
    dbModel.find((err,data)=>{
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(100).send(data);
        }
    
    })
})

//listener
app.listen(port, ()=> console.log(`listening on localhost:${port}`))