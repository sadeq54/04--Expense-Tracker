import db from "../libs/database.js";

/**
 * Update a user's information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAccounts = async (req, res) => {
  try {
    // Extract userId from the decoded token in the middleware
    const { userId } = req.body.user;

    // Validate userId
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid user ID',
      });
    }

    // Fetch accounts for the user
    const accounts = await db.query("SELECT * FROM tblaccount WHERE user_id = $1", [userId]);

    if (accounts.rows.length === 0) {
      return res.status(404).json({
        status: 'failed',
        message: 'You do not have any accounts!',
      });
    }

    // Return all accounts for the user
    res.status(200).json({
      status: 'success',
      data: accounts.rows,
    });
  } catch (error) {
    // Server-side error
    console.log(error);
    res.status(500).json({
      status: 'failed',
      message: 'Internal Server Error',
    });
  }
};

/**
 * Create a new account for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createAccount = async (req, res) => {
  try {
    // Extract userId from the decoded token in the middleware
    const { userId } = req.body.user;
    const { name, amount, accountNumber } = req.body;

    // Validate required fields
    if (!name || !amount || !accountNumber) {
      return res.status(400).json({
        status: 'failed',
        message: 'Missing required fields',
      });
    }

    // Sanitize input to prevent SQL injection
    const sanitizedAccountNumber = accountNumber.replace(/[^0-9]/g, '');
    const sanitizedAmount = parseFloat(amount);

    // Validate sanitized amount
    if (isNaN(sanitizedAmount) || sanitizedAmount <= 0) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid amount',
      });
    }

    // Check if account already exists
    const accountExistsResult = await db.query("SELECT * FROM tblaccount WHERE account_number = $1 AND user_id = $2", [sanitizedAccountNumber, userId]);
    const accountExists = accountExistsResult.rows[0];
    if (accountExists) {
      return res.status(409).json({
        status: 'failed',
        message: 'The account already exists!',
      });
    }

    
    // Create the new account
    const createAccountResult = await db.query("INSERT INTO tblaccount (account_name, account_number, account_balance, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, sanitizedAccountNumber, sanitizedAmount, userId]
    );

    // Extract the new account
    const newUserAccount = createAccountResult.rows[0];

    // Ensure account name is in array form to insert it into the accounts field in the database
    const userAccountName = Array.isArray(name) ? name : [name];

    // Insert the account and concatenate it with other accounts if they exist, and update the user data
    await db.query("UPDATE tbluser SET accounts = array_cat(accounts, $1), updatedAt = CURRENT_TIMESTAMP WHERE id = $2",
      [userAccountName, userId]
    );

    // Add the initial deposit transaction
    const description = newUserAccount.account_name + " (Initial Deposit)";

    // Add the first transaction for the new account
    await db.query("INSERT INTO tbltransaction (user_id, description, status, source, amount, type) VALUES ($1, $2, $3, $4, $5, $6)",
      [userId, description, "Completed", newUserAccount.account_name, sanitizedAmount, "income"]
    );

    // Respond with the newly created account
    res.status(201).json({
      status: "success",
      message: newUserAccount.account_name,
      data: newUserAccount
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
 * Add money to an existing account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addMoneyToAccount = async (req, res) => {
  try {
    // Extract userId from the decoded token in the middleware
    const { userId } = req.body.user;
    // Extract account id from the request parameters
    const { id } = req.params;
    const { amount } = req.body;

    // Convert the amount to a number
    const newAmount = parseFloat(amount);

    // Validate the amount
    if (isNaN(newAmount) || newAmount <= 0) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid amount',
      });
    }

    // Update the account balance
    const result = await db.query("UPDATE tblaccount SET updatedAt = CURRENT_TIMESTAMP, account_balance = (account_balance + $1) WHERE id = $2 RETURNING *",
      [newAmount, id]
    );

    const accountInformation = result.rows[0];

    // Create a description for the transaction
    const description = accountInformation.account_name + " (Deposit)";

    // Update the transaction table
    await db.query("UPDATE tbltransaction SET updatedAt = CURRENT_TIMESTAMP, type = $1, amount = $2, source = $3, status = $4, description = $5 WHERE user_id = $6",
      ["income", newAmount, accountInformation.account_name, "Completed", description, userId]
    );

    // Respond with the updated account information
    res.status(201).json({
      status: "success",
      message: "Operation completed successfully",
      data: accountInformation
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
