const {Pool} = require("pg");
const path = require("path")

require("dotenv").config({path:path.resolve(__dirname,"../.env")});

const pool = new Pool({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    database:process.env.DB_DATABASE,
    password:process.env.DB_PASSWORD,
    port:Number(process.env.DB_PORT)
});

async function connectDB()
{
    try{
        await pool.query("SELECT 1");
        console.log("Connected to database successfully")
    }
    catch(err){
        console.error("Error connecting database",err.stack);
    }
}

connectDB();

module.exports=pool;