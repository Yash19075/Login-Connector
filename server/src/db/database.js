import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async() => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("MONGO DB CONNECTED !!! ");
    }
    catch(error){
        console.log("Database connectivity error", error); 
        process.exit()
    }
}

export default connectDB;