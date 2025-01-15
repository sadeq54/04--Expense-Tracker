import db from "../libs/database.js"

export const signupUser = async (req,res)=>{
    try {
      const {firstName,email , password}  = req.body
        if (!(firstName) || (email)|| (password)){
            return res.status(404).json({
                status: "failed",
                message:"Provide the required fields"
            })
            
        } 
        const userExist = await db.query("SELECT EXISTS (SELECT * FROM tbluser WHERE email = $1)",[email]);

        if (userExist.rows[0].userExist){
            console.log(userExist.rows[0])
            return res.status(409).json({
                status: "failed",
                message:"the email address already exists. Try Login"
            })
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({
            status: "failed",
            message:error.message
        })
    }
}   