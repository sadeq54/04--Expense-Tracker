import db from "../libs/database.js";
import { getMounth } from "../libs/index.js";

/**
 * Get transactions for a user within a date range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTransactions = async (req, res) => {
  try {
    // Get the current date
    const today = new Date();
    // Copy the current date and get the date 7 days ago
    const _sevenDaysAgo = new Date(today);
    _sevenDaysAgo.setDate(today.getDate() - 7);
    // Store the date as YYYY-MM-DD
    const sevenDaysAgo = _sevenDaysAgo.toISOString().split("T")[0];

    // Extract query parameters
    const { df, dt, s } = req.query;
    // Extract userId from the decoded token in the middleware
    const { userId } = req.body.user;

    // Validate userId
    if (!userId) {
      return res.status(403).json({
        status: 'failed',
        message: 'Invalid user ID!',
      });
    }

    // Set start and end dates for the query
    const startDate = new Date(df || sevenDaysAgo);
    const endDate = new Date(dt || new Date());

    // Fetch transactions for the user within the date range and matching the search term
    const transactions = await db.query(
      "SELECT * FROM tbltransaction WHERE user_id = $1 AND createdAt BETWEEN $2 AND $3 AND (description ILIKE '%' || $4 || '%' OR status ILIKE '%' || $4 || '%' OR source ILIKE '%' || $4 || '%') ORDER BY id DESC",
      [userId, startDate, endDate, s]
    );

    res.status(200).json({
      status: 'success',
      data: transactions.rows,
    });
  } catch (error) {
    // Server-side error
    console.log(error);
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

/**
 * Get dashboard information for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDashBoardInformation = async (req, res) => {
  try {
    const { userId } = req.body.user;

    // Validate userId
    if (!userId) {
      return res.status(403).json({
        status: 'failed',
        message: 'Invalid user ID!',
      });
    }

    let totalExpense = 0;
    let totalIncome = 0;

    const transactionRes = await db.query(
      "SELECT type, SUM(amount) as totalAmount FROM tbltransaction WHERE user_id = $1 GROUP BY type",
      [userId]
    );

    const transactions = transactionRes.rows;
    if (!transactions.length) {
      return res.status(404).json({
        status: 'failed',
        message: 'There are no transactions!',
      });
    }

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        totalIncome += transaction.totalAmount;
      } else if (transaction.type === "expense") {
        totalExpense += transaction.totalAmount;
      }
    });

    const availableBalance = totalIncome - totalExpense;

    const year = new Date().getFullYear();
    const start_date = new Date(year, 0, 1); // 1/1 first day of the year
    const end_date = new Date(year, 11, 31, 23, 59, 59); // 31/12 last day of the year

    const result = await db.query(
      "SELECT type, SUM(amount) as totalAmount, EXTRACT(MONTH FROM createdAt) as month FROM tbltransaction WHERE user_id = $1 AND createdAt BETWEEN $2 AND $3 GROUP BY type, EXTRACT(MONTH FROM createdAt)",
      [userId, start_date, end_date]
    );

    // Organize data for chart
    const data = new Array(12).fill(null).map((_, index) => {
      const monthData = result.rows.filter(
        (item) => parseInt(item.month) === index + 1
      );
      
      const income = monthData.find((item) => item.type === 'income')?.totalamount || 0;
      const expense = monthData.find((item) => item.type === 'expense')?.totalamount || 0;

      return {
        label: getMounth(index),
        income,
        expense
      };
    });

    const lastTransactionResult = await db.query(
      "SELECT * FROM tbltransaction WHERE user_id = $1 ORDER BY id DESC LIMIT 5",
      [userId]
    );
    const lastTransaction = lastTransactionResult.rows;

    const lastAccountRes = await db.query(
      "SELECT * FROM tblaccount WHERE user_id = $1 ORDER BY id DESC LIMIT 4",
      [userId]
    );
    const lastAccount = lastAccountRes.rows;

    res.status(200).json({
      status: 'success',
      availableBalance,
      totalIncome,
      totalExpense,
      chartData: data,
      lastAccount,
      lastTransaction
    });
  } catch (error) {
    // Server-side error
    console.log(error);
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

/**
 * Add a new transaction for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addTransaction = async (req, res) => {
  try {
    // Extract userId from the decoded token in the middleware
    const { userId } = req.body.user;
    // Extract account id from the request parameters
    const { account_id } = req.params;
    const { description, source, amount } = req.body;

    // Validate userId
    if (!userId) {
      return res.status(403).json({
        status: 'failed',
        message: 'Invalid user ID!',
      });
    }

    // Validate required fields
    if (!(amount && description && source)) {
      return res.status(403).json({
        status: 'failed',
        message: 'Provide the required fields!',
      });
    }

    // Validate amount
    if (Number(amount) <= 0) {
      return res.status(403).json({
        status: 'failed',
        message: 'Amount should be greater than 0.',
      });
    }

    // Fetch account information
    const result = await db.query("SELECT * FROM tblaccount WHERE id = $1", [account_id]);
    const accountInfo = result.rows[0];

    // Validate account information
    if (!accountInfo) {
      return res.status(403).json({
        status: 'failed',
        message: 'Invalid account information!',
      });
    }

    // Validate account balance
    if (accountInfo.account_balance < Number(amount) || accountInfo.account_balance <= 0) {
      return res.status(403).json({
        status: 'failed',
        message: 'Transaction failed. Insufficient account balance.',
      });
    }

    // Start a new database transaction
    await db.query("BEGIN");

    // Update account balance
    await db.query(
      "UPDATE tblaccount SET account_balance = account_balance - $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2",
      [amount, account_id]
    );

    // Insert new transaction
    await db.query(
      "INSERT INTO tbltransaction (user_id, description, source, amount, type, status, createdAt) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)",
      [userId, description, source, amount, "expense", "Completed"]
    );

    // Commit the transaction
    await db.query("COMMIT");

    res.status(200).json({
      status: 'success',
      message: 'Transaction successful',
    });
  } catch (error) {
    // Server-side error
    await db.query("ROLLBACK");
    console.log(error);
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

/**
 * Transfer money to another account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const transferMoneyToAccount = async (req, res) => {
  try {
    
    const { userId } = req.body.user;
    const { from_account, to_account, amount } = req.body;

    // Validate userId
    if (!userId) {
      return res.status(403).json({
        status: 'failed',
        message: 'Invalid user ID!',
      });
    }

    // Validate required fields
    if (!(from_account && to_account && amount)) {
      return res.status(403).json({
        status: 'failed',
        message: "Provide the required fields!",
      });
    }

    const newAmount = Number(amount);

    // Validate amount
    if (newAmount <= 0) {
      return res.status(403).json({
        status: 'failed',
        message: "The amount should be greater than 0!",
      });
    }

    // Fetch from account information
    const frmAccountRes = await db.query("SELECT * FROM tblaccount WHERE id = $1", [from_account]);
    const fromAccount = frmAccountRes.rows[0];

    // Validate from account information
    if (!fromAccount) {
      return res.status(404).json({
        status: 'failed',
        message: 'The account does not exist!',
      });
    }

    // Validate from account balance
    if (fromAccount.account_balance < newAmount || fromAccount.account_balance <= 0) {
      return res.status(403).json({
        status: 'failed',
        message: 'Transaction failed. Insufficient account balance.',
      });
    }

    // Fetch to account information
    const toAccountRes = await db.query("SELECT * FROM tblaccount WHERE id = $1", [to_account]);
    const toAccount = toAccountRes.rows[0];

    // Validate to account information
    if (!toAccount) {
      return res.status(404).json({
        status: 'failed',
        message: 'The account does not exist!',
      });
    }

    // Start a new database transaction
    await db.query("BEGIN");

    // Update from account balance
    await db.query(
      "UPDATE tblaccount SET account_balance = account_balance - $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2",
      [newAmount, from_account]
    );

    // Update to account balance
    await db.query(
      "UPDATE tblaccount SET account_balance = account_balance + $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2",
      [newAmount, to_account]
    );

    const description1 = `Transfer (${fromAccount.account_name} - ${toAccount.account_name})`;

    // Insert transaction for from account
    await db.query(
      "INSERT INTO tbltransaction (user_id, description, source, amount, type, status, createdAt) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)",
      [userId, description1, fromAccount.account_name, newAmount, "expense", "Completed"]
    );

    const description2 = `Received (${fromAccount.account_name} - ${toAccount.account_name})`;

    // Insert transaction for to account
    await db.query(
      "INSERT INTO tbltransaction (user_id, description, source, amount, type, status, createdAt) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)",
      [userId, description2, toAccount.account_name, newAmount, "income", "Completed"]
    );

    // Commit the transaction
    await db.query("COMMIT");

    res.status(200).json({
      status: 'success',
      message: 'Transaction successful',
    });
  } catch (error) {
    // Server-side error
    await db.query("ROLLBACK");
    console.log(error);
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};
