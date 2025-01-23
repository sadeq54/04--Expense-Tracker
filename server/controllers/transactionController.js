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
   const {userId} = req.body.user
   const totalExpense = 0
    const totalIncome = 0

    const transactionRes = await db.query("select type, SUM(amount) as totalAmount  from tbltransaction where user_id = $1",
      [userId]
    )

    const transactions = transactionRes.rows[0]
    if (!transactions){
      return  res.status(404).json({
        status: 'failed',
        message: 'there is no any transactions here!',
      });
    }
    transactions.forEach((transaction) => {
      if (transaction.type == "amount"){
        totalIncome += transaction.totalAmount
      }else if (transaction.type == "expense"){
        totalExpense += transaction.totalAmount
      }
    });
    const avalibleBalance = totalIncome - totalExpense

    const year = new Date().getFullYear()
    const strart_date = new Date(year , 0 , 1) // 1/1 first day of the year
    const end_date = new Date(year , 11 , 31 , 23 , 59 , 59); // 31/12 last day of the year

    // ask copilote "explain goup by with example use input output" if u do not get it 
    const result = await db.query("SELECT type, SUM(amount) as totalAmount, EXTRACT(MOUNTH FROM createdAt) as mounth FROM tbltransaction WHERE user_id = $1 and createdAt BETWEEN $2 AND $3 GROUP BY EXTRACT(MOUNTH FROM createdAt) ",
      [userId, strart_date, end_date]
    )

      // orgnise data 
      // - in map is callback function: here it is not used 
      
      const data =  new Array(null).fill().map((_, index)=>{
        const mountData = result.rows.filter(
          (item)=> parseInt(item.mounth) == index +1
        );
      });
      /* 
      the form of the array 
      [
  [
    { type: 'expense', totalAmount: 175, month: 1 },
    { type: 'income', totalAmount: 200, month: 1 }
  ],
  [
    { type: 'expense', totalAmount: 50, month: 2 },
    { type: 'income', totalAmount: 150, month: 2 }
  ],
  [], // March
  [], // April
  [], // May
  [], // June
  [], // July
  [], // August
  [], // September
  [], // October
  [], // November
  []  // December
]
      */


  
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
    const {userId} = req.body.user
    const {from_account , to_account , amount}  = req.body
     if (!(from_account || to_account || amount)){
        return  res.status(403).json({
          status: 'failed',
          message: "provide the required fields!",
        });
     }
     const newAmount = Number(amount)

     if (newAmount <= 0){
     return res.status(403).json({
        status: 'failed',
        message: "the amount should be greater than 0!",
      });
     }
      const frmAccountRes= await db.query("select * from tblaccount where id = $1",
        [from_account]  
      )

      const fromAccount = frmAccountRes.rows[0]

      if (!fromAccount){
        return  res.status(404).json({
          status: 'failed',
          message: 'the account is not exists!',
        });
      }
      if (fromAccount.account_balance < newAmount || fromAccount.account_balance <= 0){
        return res.status(403).json({
          status: 'failed',
          message: 'Transaction failed. Insufficient account balance.',
        });
      }

      const toAccountRes = await db.query("select * from tblaccount where id = $1",
        [to_account]
      )

      const toAccount = toAccountRes.rows[0]

      if (!toAccount){
        return res.status(404).json({
          status: 'failed',
          message: 'the account is not exists!',
        });
      }
      await db.query("BEGIN")

      await db.query("UPDATE tblaccount SET account_balance = account_balance - $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2",
        [newAmount, from_account]
      );

      await db.query("UPDATE tblaccount SET account_balance = account_balance + $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2",
        [newAmount, to_account]
      );

      const description1= `Transfer (${fromAccount.account_name} - ${toAccount.account_name})`

      await db.query("INSERT INTO tbltransaction (user_id, description, source, amount, type, status, createdAt) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)",
        [userId, description1, fromAccount.account_name, newAmount, "expense", "Completed"]
      );
      const description2= `Received (${fromAccount.account_name} - ${toAccount.account_name})`

      await db.query("INSERT INTO tbltransaction (user_id, description, source, amount, type, status, createdAt) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)",
        [userId, description2, toAccount.account_name, newAmount, "income", "Completed"]
      );

      await db.query("COMMIT")

      res.status(200).json({
        status: 'success',
        message: 'Transaction successful',
      });

  } catch (error) {
    // Server-side error
    await db.query("ROLLBACK")
    console.log(error);
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};
