import { getAuth } from "@clerk/express";
import BusinessProfile from "../models/businessProfileModel.js";
import cloudinary from "../config/cloudinary.js";

/* ===========================================================
    Upload buffer to Cloudinary
   =========================================================== */
async function uploadToCloudinary(file, folder) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `invoiceapp/${folder}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
}

/* ===========================================================
   CREATE BUSINESS PROFILE
   =========================================================== */
export async function createBusinessProfile(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const body = req.body || {};

    //  Upload images to Cloudinary
    const logoFile = req.files?.logoName?.[0];
    const stampFile = req.files?.stampName?.[0];
    const signatureFile = req.files?.signatureNameMeta?.[0];

    const logoUrl = await uploadToCloudinary(logoFile, "logos");
    const stampUrl = await uploadToCloudinary(stampFile, "stamps");
    const signatureUrl = await uploadToCloudinary(signatureFile, "signatures");

    const profile = new BusinessProfile({
      owner: userId,
      businessName: body.businessName || "ABC Solutions",
      email: body.email || "",
      address: body.address || "",
      phone: body.phone || "",
      gst: body.gst || "",
      logoUrl: logoUrl || body.logoUrl || null,
      stampUrl: stampUrl || body.stampUrl || null,
      signatureUrl: signatureUrl || body.signatureUrl || null,
      signatureOwnerName: body.signatureOwnerName || "",
      signatureOwnerTitle: body.signatureOwnerTitle || "",
      defaultTaxPercent:
        body.defaultTaxPercent !== undefined ? Number(body.defaultTaxPercent) : 18,
    });

    const saved = await profile.save();

    return res.status(201).json({
      success: true,
      data: saved,
      message: "Business profile created",
    });

  } catch (err) {
    console.error("createBusinessProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ===========================================================
   UPDATE BUSINESS PROFILE
   =========================================================== */
export async function updateBusinessProfile(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { id } = req.params;
    const body = req.body || {};

    const existing = await BusinessProfile.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Business profile not found" });
    }

    if (existing.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Not your profile" });
    }

    //  Upload new images if provided
    const logoFile = req.files?.logoName?.[0];
    const stampFile = req.files?.stampName?.[0];
    const signatureFile = req.files?.signatureNameMeta?.[0];

    const update = {};

    if (body.businessName !== undefined) update.businessName = body.businessName;
    if (body.email !== undefined) update.email = body.email;
    if (body.address !== undefined) update.address = body.address;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.gst !== undefined) update.gst = body.gst;

    if (logoFile) {
      update.logoUrl = await uploadToCloudinary(logoFile, "logos");
    } else if (body.logoUrl !== undefined) {
      update.logoUrl = body.logoUrl;
    }

    if (stampFile) {
      update.stampUrl = await uploadToCloudinary(stampFile, "stamps");
    } else if (body.stampUrl !== undefined) {
      update.stampUrl = body.stampUrl;
    }

    if (signatureFile) {
      update.signatureUrl = await uploadToCloudinary(signatureFile, "signatures");
    } else if (body.signatureUrl !== undefined) {
      update.signatureUrl = body.signatureUrl;
    }

    if (body.signatureOwnerName !== undefined)
      update.signatureOwnerName = body.signatureOwnerName;

    if (body.signatureOwnerTitle !== undefined)
      update.signatureOwnerTitle = body.signatureOwnerTitle;

    if (body.defaultTaxPercent !== undefined)
      update.defaultTaxPercent = Number(body.defaultTaxPercent);

    const updated = await BusinessProfile.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Profile updated",
    });

  } catch (err) {
    console.error("updateBusinessProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ===========================================================
   GET MY BUSINESS PROFILE
   =========================================================== */
export async function getMyBusinessProfile(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const profile = await BusinessProfile.findOne({ owner: userId }).lean();

    if (!profile) {
      return res.status(204).json({ success: true, message: "No profile found" });
    }

    return res.status(200).json({ success: true, data: profile });

  } catch (err) {
    console.error("getMyBusinessProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
