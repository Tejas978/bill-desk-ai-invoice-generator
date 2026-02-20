import cors from "cors";
import "dotenv/config";
import express from "express";
import path from "path";

import { connectDB } from "./config/db.js";

//  Clerk
import { clerkMiddleware } from "@clerk/express";

import businessProfileRouter from "./routes/businessProfileRouter.js";
import invoiceRouter from "./routes/invoiceRouter.js";
import aiInvoiceRouter from "./routes/aiInvoiceRouter.js";

const app = express();
const port = process.env.PORT || 4000;

// CORS (important)
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://bill-desk-ai-invoice-generator-1.onrender.com"
  ],
  credentials: true
}));

//  Clerk middleware (adds req.auth)
app.use(clerkMiddleware());

// Body parsers
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// DB
connectDB();

// Static uploads
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

//  Protected Routes (now secured properly)
app.use("/api/businessProfile", businessProfileRouter);
app.use("/api/invoice", invoiceRouter);
app.use("/api/ai", aiInvoiceRouter);

// Test
app.get("/", (req, res) => {
  res.send("API Working with Clerk Auth");
});

app.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`);
});
