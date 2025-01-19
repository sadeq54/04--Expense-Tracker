import JWT from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req?.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({
      status: "failed",
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = JWT.decode(token, { complete: true });

    if (!decoded || !decoded.payload || !decoded.payload.userId) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid token",
      });
    }

    const userId = decoded.payload.userId;

    // Check if the userId is a positive integer
    if (typeof userId !== "number" || userId <= 0) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid user ID",
      });
    }

    // Verify the token signature
    const verified = JWT.verify(token, process.env.JWT_SECRET);

    // Check if the token has expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (verified.exp < currentTime) {
      return res.status(401).json({
        status: "failed",
        message: "Token has expired",
      });
    }

    req.body.user = {
      userId,
    };

    next();

  } catch (error) {
    if (error instanceof JWT.TokenExpiredError) {
      return res.status(401).json({
        status: "failed",
        message: "Token has expired",
      });
    }

    return res.status(401).json({
      status: "failed",
      message: "Invalid token",
    });
  }
};