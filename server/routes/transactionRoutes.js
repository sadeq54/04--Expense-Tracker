import express from "express"
import { authMiddleware } from "../middleware/autheMiddleware.js";
import {getTransactions, getDashBoardInformation, addTransaction , transferMoneyToAccount} from "../controllers/transactionController.js"
const router = express.Router();

// get all the transactions 
router.get("/", authMiddleware, getTransactions);

router.get("/dashboard", authMiddleware, getDashBoardInformation);

// in this route the user can withdrawing money from his account   
router.post("/add-transaction/:account_id", authMiddleware, addTransaction);


// in this route the user can transfer money between accounts
router.put("/transfer-money", authMiddleware, transferMoneyToAccount);

export default router;

