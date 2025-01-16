import JWT from "jsonwebtoken";


export const authMiddleware = async (req, res, next) => {
  const authHeader = req?.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({
      status: "failed",
      message: "Unauthorized",
    });
  }
     // split the token
  const token = authHeader?.split(" ")[1];

  try {
    // verify the token  by passing the token and the secret key 
    const userToken  = JWT.verify(token, process.env.JWT_SECRET);
    req.body.user={
        userId:userToken.userId,
    };
    next();

  } catch (error) {
    return res.status(401).json({
      status: "failed",
      message: "Invalid token",
    });
  }
};
