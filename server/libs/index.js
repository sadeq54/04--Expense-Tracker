


import bcrypt from "bcrypt"
import JWT from "jsonwebtoken"


// here how to create a hash a password 
export const hashedPassword  = async (userValue)=>{
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userValue, salt);

    return hashedPassword;
}


// compere password and the user password 
export const comperePassword  = async (userPassword , password)=>{
    try {
        const isMatch = await bcrypt.compare(userPassword, password)
        return isMatch
    } catch (error) {
        
    }
}



// create JWT   
export const createJWT = (id)=>{
      return JWT.sign({
        userId:id}, process.env.JWT_SECRET, { expiresIn:"1d"}
    )
}