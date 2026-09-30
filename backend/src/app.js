import express from "express";

const app = express();

app.use(express.json());


app.get("/api/home",(req,res)=>{
    res.send("hey this is the home page");
})

export default app;
