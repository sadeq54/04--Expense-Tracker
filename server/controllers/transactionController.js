import db from "../libs/database.js";

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
    // Implementation for fetching dashboard information
    // ...
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
    // Implementation for transferring money to another account
    // ...
  } catch (error) {
    // Server-side error
    console.log(error);
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};
