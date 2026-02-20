import mongoose from "mongoose";
import { getAuth } from "@clerk/express";
import Invoice from "../models/invoiceModel.js";
import cloudinary from "../config/cloudinary.js";

/* ===========================================================
   Upload to Cloudinary
=========================================================== */
async function uploadToCloudinary(file, folder) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `invoiceapp/${folder}` },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
}

/* ===========================================================
   Compute totals
=========================================================== */
function computeTotals(items = [], taxPercent = 0) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0),
    0
  );
  const tax = (subtotal * taxPercent) / 100;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

/* ===========================================================
   CREATE INVOICE
=========================================================== */
export async function createInvoice(req, res) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return res.status(401).json({ success: false, message: "Authentication required" });

    const body = req.body;

    const items = Array.isArray(body.items)
      ? body.items
      : JSON.parse(body.items || "[]");

    const taxPercent = Number(body.taxPercent || 0);
    const totals = computeTotals(items, taxPercent);

    /* 🔥 STATUS FIX START */
    const rawStatus = body.status || body.payment_status || "draft";
    const normalizedStatus = String(rawStatus).toLowerCase();

    const allowedStatuses = ["draft", "sent", "paid", "unpaid", "overdue"];

    const finalStatus = allowedStatuses.includes(normalizedStatus)
      ? normalizedStatus
      : "draft";
    /* 🔥 STATUS FIX END */

    // Upload images
    const logoUrl = await uploadToCloudinary(req.files?.logoName?.[0], "logos");
    const stampUrl = await uploadToCloudinary(req.files?.stampName?.[0], "stamps");
    const signatureUrl = await uploadToCloudinary(req.files?.signatureNameMeta?.[0], "signatures");

    const invoice = await Invoice.create({
      owner: userId,
      invoiceNumber: body.invoiceNumber || `INV-${Date.now()}`,
      issueDate: body.issueDate || new Date(),
      dueDate: body.dueDate,
      client: body.client,
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: body.currency || "INR",
      status: finalStatus,   //  FIXED HERE
      taxPercent,
      logoDataUrl: logoUrl || body.logoDataUrl || null,
      stampDataUrl: stampUrl || body.stampDataUrl || null,
      signatureDataUrl: signatureUrl || body.signatureDataUrl || null,
      notes: body.notes || "",
    });

    return res.status(201).json({
      success: true,
      message: "Invoice created",
      data: invoice,
    });

  } catch (err) {
    console.error("CREATE INVOICE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
/* ===========================================================
   GET ALL
=========================================================== */
export async function getInvoices(req, res) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return res.status(401).json({ success: false, message: "Authentication required" });

    const invoices = await Invoice.find({ owner: userId }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: invoices });

  } catch (err) {
    console.error("GET INVOICES ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ===========================================================
   GET BY ID
=========================================================== */
export async function getInvoiceById(req, res) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return res.status(401).json({ success: false, message: "Authentication required" });

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      owner: userId,
    });

    if (!invoice)
      return res.status(404).json({ success: false, message: "Invoice not found" });

    return res.status(200).json({ success: true, data: invoice });

  } catch (err) {
    console.error("GET INVOICE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ===========================================================
   UPDATE
=========================================================== */
export async function updateInvoice(req, res) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return res.status(401).json({ success: false, message: "Authentication required" });

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      owner: userId,
    });

    if (!invoice)
      return res.status(404).json({ success: false, message: "Invoice not found" });

    const items = Array.isArray(req.body.items)
      ? req.body.items
      : JSON.parse(req.body.items || "[]");

    const taxPercent = Number(req.body.taxPercent || invoice.taxPercent);
    const totals = computeTotals(items, taxPercent);

    // Upload new images if provided
    const logoUrl = await uploadToCloudinary(req.files?.logoName?.[0], "logos");
    const stampUrl = await uploadToCloudinary(req.files?.stampName?.[0], "stamps");
    const signatureUrl = await uploadToCloudinary(req.files?.signatureNameMeta?.[0], "signatures");

    invoice.items = items;
    invoice.subtotal = totals.subtotal;
    invoice.tax = totals.tax;
    invoice.total = totals.total;
    invoice.taxPercent = taxPercent;

    if (logoUrl) invoice.logoDataUrl = logoUrl;
    if (stampUrl) invoice.stampDataUrl = stampUrl;
    if (signatureUrl) invoice.signatureDataUrl = signatureUrl;

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice updated",
      data: invoice,
    });

  } catch (err) {
    console.error("UPDATE INVOICE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ===========================================================
   DELETE
=========================================================== */
export async function deleteInvoice(req, res) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return res.status(401).json({ success: false, message: "Authentication required" });

    await Invoice.deleteOne({
      _id: req.params.id,
      owner: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Invoice deleted",
    });

  } catch (err) {
    console.error("DELETE INVOICE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
