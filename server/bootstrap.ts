import * as dotenv from "dotenv";
dotenv.config(); // ✅ Load .env BEFORE anything else

console.log("DEBUG .env loaded, DATABASE_URL =", process.env.DATABASE_URL);

// ✅ Now import your main server
import "./index";
