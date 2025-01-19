import { comperePassword, hashedPassword } from "../libs/index.js";
import db from "../libs/database.js";

/**
 * Get a user's information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUser = async (req, res) => {
  try {
    // Input validation: Check if userId is present and is a positive integer
    const { userId } = req.body.user;

    console.log('userId:', userId);
    
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid user ID',
      });
    }
    
    // Sanitize input data to prevent SQL injection
    // const sanitizedUserId = parseInt(userId, 10);
    // no need In this case, you don't need to sanitize the userId using parseInt() or any other method.
    //The JWT.verify() function will ensure that the token is valid and that the userId is extracted from the token.

    // Check if user exists
    const userExist = await db.query("SELECT * FROM tbluser WHERE id = $1", [
      userId,
    ]);

    const user = userExist.rows[0];
    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found',
      });
    }

    // Remove password from response
    user.password = undefined;

    return res.status(200).json({
      status: 'success',
      user,
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
 * Change a user's password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const changePassword = async (req, res) => {
  try {
    // Input validation: Check if userId is present and is a positive integer
    const { userId } = req.body.user;
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid user ID',
      });
    }

    // Input validation: Check if required fields are present
    const requiredFields = ['currentPassword', 'newPassword', 'confirmPassword'];
    if (!requiredFields.every(field => req.body[field])) {
      return res.status(400).json({
        status: 'failed',
        message: 'Missing required fields',
      });
    }

    // Sanitize input data to prevent SQL injection
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const sanitizedData = {
      currentPassword: currentPassword.trim(),
      newPassword: newPassword.trim() ,
      confirmPassword: confirmPassword.trim(),
    };
    

    // Check if user exists
    const userExist = await db.query("SELECT * FROM tbluser WHERE id = $1", [userId]);
    const user = userExist.rows[0];
    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found',
      });
    }

    // Check if new passwords match
    if (sanitizedData.newPassword !== sanitizedData.confirmPassword) {
      return res.status(401).json({
        status: 'failed',
        message: 'New passwords do not match',
      });
    }

    // Check if current password is correct
    const isMatch = comperePassword(sanitizedData.currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'failed',
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const newHashedPassword = hashedPassword(sanitizedData.newPassword);

    // Update user password
    await db.query("UPDATE tbluser SET password = $1 WHERE id = $2", [
      newHashedPassword,
      userId,
    ]);

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
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
 * Update a user's information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateUser = async (req, res) => {
  try {
    // Input validation: Check if userId is present and is a positive integer
    const { userId } = req.body.user;
   
        if (!userId || typeof userId !== 'number' || userId <= 0) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid user ID',
      });
    }

    // Input validation: Check if required fields are present
    // const requiredFields = ['firstName', 'lastName', 'country', 'currency', 'contact'];
    // if (!requiredFields.every(field => req.body[field])) {
    //   return res.status(400).json({
    //     status: 'failed',
    //     message: 'Missing required fields',
    //   });
    // }

    // Sanitize input data to prevent SQL injection
    const { firstName, lastName, country, currency, contact } = req.body;
    const sanitizedData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      country: country.trim(),
      currency: currency.trim(),
      contact: contact.trim(),
    };

    // Check if user exists
    const userExist = await db.query("SELECT * FROM tbluser WHERE id = $1", [userId]);
    const user = userExist.rows[0];
    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found',
      });
    }

    // Update user data
    const updateUser = await db.query(
      "UPDATE tbluser SET firstName = $1, lastName = $2, currency = $3, country = $4, contact = $5, updatedAt = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *",
      [sanitizedData.firstName, sanitizedData.lastName, sanitizedData.currency, sanitizedData.country, sanitizedData.contact, userId]
    );

    // Remove password from response
    updateUser.rows[0].password = undefined;

    res.status(201).json({
      status: 'success',
      user: updateUser.rows[0],
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
