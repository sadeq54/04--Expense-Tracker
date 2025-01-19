import db from "../libs/database.js";
import { hashedPassword , comperePassword , createJWT} from "../libs/index.js";

export const signupUser = async (req, res) => {
  try {
    const { firstName, email, password } = req.body;
    // check agaisnt empty values input validation
    if (!(firstName || email || password)) {
      return res.status(404).json({
        status: "failed",
        message: "Provide the required fields correctly",
      });
    }
    // the resulte will be boolean
    const userExist = await db.query(
      "SELECT EXISTS (SELECT * FROM tbluser WHERE email = $1)",
      [email]
    );

    if (userExist.rows[0].userExist) {
      
      // we need to make return t prevent the rest of code to be
      // executed
      return res.status(409).json({
        status: "failed",
        message: "the email address already exists. Try Login",
      });
    }

    const hashedpassword = await hashedPassword(password);
  
    const user = await db.query(
      "insert into tbluser (firstName, email , password) VALUES ($1, $2, $3) RETURNING *",
      [firstName, email, hashedpassword]
    );
    user.rows[0].password = undefined;
    // setting the user to undefined because we want to return
    // the user info to the client side

    res.status(201).json({
      stutus: "success",
      message: "user account created successfully",
      user: user.rows[0],
    });
  } catch (error) {
    // sever side issue
    console.log(error);
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};


export const signinUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // fisrt check agaisnt empty values input validation
    if (!( email || password)) {
      return res.status(404).json({
        status: "failed",
        message: "Provide the required fields correctly",
      });
    }
    // secound check if the user is exists or not
    const resulte = await db.query("select * from tbluser where email = $1", [
      email,
    ]);
    const user = resulte.rows[0];
    if (!user) {
      return res.status(401).json({
        status: "failed",
        message: "the email that you provided is incorrect!",
      });
    }

    // u have to pass them in order
    const isMatch = comperePassword(password, user?.password);

    if (!isMatch) {
      return res.status(401).json({
        status: "failed",
        message: "the password or email that you provided is incorrect!",
      });
    } 
      // creating a JWT u need the id of the user
      const { id } = user;
      user.password = undefined
      
      const token = createJWT(id);
      res.status(201).json({
            status:"success",
            message:"Login Successfully",
            user,
            token
      })
  } catch (error) {
    // sever side issue
    console.log(error);
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};
