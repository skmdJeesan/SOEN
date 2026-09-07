import mongoose from "mongoose";

const connect_db = async () => {
    if(mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('connected to mongo db')
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

export default connect_db