import express from "express"
import { authMiddleware } from "../middleware/autheMiddleware.js"
import {getUser , changePassword , updateUser} from "../controllers/userController.js"
const router = express.Router()

// this route to display allthe data of the user 
router.get("/", authMiddleware , getUser)

// this route use to change the pss of the user 
router.put("/change-password", authMiddleware , changePassword)

// thsis the route use to change the user info
router.put("/:id", authMiddleware , updateUser)

export default router
// thes roetes needs a Middleware because they are maintaining the user info 
// and the user info is a sensitive data 
// so  Middleware used to make a check if the user is allowed to maintain these data 