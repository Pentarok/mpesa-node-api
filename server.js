require("dotenv").config();

const express = require("express")
const cors = require("cors");
const {readdirSync} = require("fs")
const {db}= require('./db/db')
const app = express();
app.use(express.json());
app.use(cors({
 
     origin:"https://expense-app-client-c578oy2ad-mak-pentaroks-projects.vercel.app", 
    methods:["GET","POST","DELETE"],
    credentials:true
}))
//routes

readdirSync('./routes').map((route)=> app.use('/api/v1',require('./routes/' + route)))
const PORT = process.env.PORT;
const server = ()=>{
    db()
    
    app.listen(PORT, () => {
        console.log('listening to port:', PORT)
    })
}
server()