import express from "express"

import authRoutes from "./authRoutes.js"
 import userRoutes from "./userRoutes.js"
 import accountRoutes from "./accountRoutes.js"
import transactionRoutes from "./transactionRoutes.js"

const router = express.Router();

router.use("/auth", authRoutes)
router.use("/user", userRoutes)
 router.use("/account", accountRoutes)
router.use("/transaction", transactionRoutes)

export default router;






// what is the routes :
//Routes are needed to map URLs to specific handlers 
// or functions in an application. 
// They allow the application to respond to different HTTP requests (e.g., GET, POST, PUT, DELETE)
//  and direct them to the correct logic or resource.
//  In other words, routes help the application understand
//  what to do when a user visits a specific URL or sends
//  a request to the server.



//  =======  why we need routes

// Routers help organize and structure the code, 
// making it more readable, maintainable, and scalable. 
// While it's technically possible to build an app without routes, 
// using routers makes it easier to manage complexity and keep the codebase organized, 
// especially as the application grows.