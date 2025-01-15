import pg from "pg"

import dotenv from "dotenv"

dotenv.config();

const db = new pg.Pool({
    host:process.env.DBHOST , 
    port: process.env.DBPORT ,
    user: process.env.DBUSER ,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME 
})

export default db;