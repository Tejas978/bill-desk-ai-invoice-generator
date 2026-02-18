// routes/businessProfileRouter.js
import express from "express";
import multer from "multer";
import { requireAuth } from "@clerk/express";

import {
  createBusinessProfile,
  getMyBusinessProfile,
  updateBusinessProfile,
} from "../controllers/businessProfileController.js";

const businessProfileRouter = express.Router();

// Protect all routes
businessProfileRouter.use(requireAuth());


const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Create
businessProfileRouter.post(
  "/",
  upload.fields([
    { name: "logoName", maxCount: 1 },
    { name: "stampName", maxCount: 1 },
    { name: "signatureNameMeta", maxCount: 1 },
  ]),
  createBusinessProfile
);

// Update
businessProfileRouter.put(
  "/:id",
  upload.fields([
    { name: "logoName", maxCount: 1 },
    { name: "stampName", maxCount: 1 },
    { name: "signatureNameMeta", maxCount: 1 },
  ]),
  updateBusinessProfile
);

// Get current user profile
businessProfileRouter.get("/me", getMyBusinessProfile);

export default businessProfileRouter;
