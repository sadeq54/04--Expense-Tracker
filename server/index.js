import cors from "cors"
import express from "express"
import dotenv from "dotenv"
import routes from "./routes/index.js"
import db from "./libs/database.js"

dotenv.config()


const app = express();
const port = process.env.PORT || 8000

app.use(cors("*"))
app.use(express.json({limit: "10mb"}))
app.use(express.urlencoded({extended: true}))
// this means that your app become able to recive and sent requests form another orgins 
// not only your server 


app.use("/api-v1", routes)

app.use("*",(req, res)=>{
    res.status(404).json({
        status:"not found",
        message:"Rout not found"
    })
})
// This code sets up a catch-all route for the Express.js app. If a request is made to a route that doesn't exist, it returns a 404 status code with a JSON response containing an error message. 

app.listen(port, ()=>{
    console.log(`server is running on port ${port} http://localhost:${port}`)
})