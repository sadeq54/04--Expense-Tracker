
import express from "express"
import { authMiddleware } from "../middleware/autheMiddleware.js"
import {getAccounts , createAccount , addMoneyToAccount } from "../controllers/accountController.js"
const router = express.Router();


router.get("/:id?", authMiddleware , getAccounts);

router.post("/create", authMiddleware , createAccount);
router.post("/add-money/:id", authMiddleware , addMoneyToAccount);


export default router;