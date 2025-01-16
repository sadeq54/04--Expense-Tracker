import express from "express"
import { authMiddleware } from "../middleware/autheMiddleware"
import {getUser , changePassword , updateUser} from "../controllers/userController.js"
const router = express.Router()


router.get("/user", authMiddleware , getUser)
router.put("/change-password", authMiddleware , changePassword)
router.put("/:id", authMiddleware , updateUser)

