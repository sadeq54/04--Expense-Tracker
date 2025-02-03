import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";

// here how to create a hash a password
export const hashedPassword = async (userValue) => {
  try {
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(userValue, salt);

    return hashedPassword;
  } catch (error) {
    console.error(error);
  }
};

// compere password and the user password
export const comperePassword = async (userPassword, password) => {
  try {
    // u have to pass them in order
    const isMatch = await bcrypt.compare(userPassword, password);
    return isMatch;
  } catch (error) {}
};

// create JWT   that end after oner day
export const createJWT = (id) => {
  return JWT.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

export function getMounth(index) {
  const mounths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  
  return mounths[index];
}
