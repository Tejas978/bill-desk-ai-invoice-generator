import mongoose from "mongoose";
import { getAuth } from "@clerk/express";
import Invoice from "../models/invoiceModel.js";
import cloudinary from "../config/cloudinary.js";

/* ===========================================================
   Upload buffer to Cloudinary
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
   Compute subtotal, tax, total
=========================================================== */
function computeTotals(items = [], taxPercent = 0) {
  const safe = Array.isArray(items) ? items.filter(Boolean) : [];
  const subtotal = safe.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  const tax = (subtotal * Number(taxPercent || 0)) / 100;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function parseItemsField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return [];
}

function isObjectIdString(val) {
  return typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val);
}

/* ===========================================================
   Generate Unique Invoice Number
=========================================================== */
async function generateUniqueInvoiceNumber() {
  const ts = Date.now().toString();
  const suffix = Math.floor(Math.random() * 900000)
    .toString()
    .padStart(6, "0");

  return `INV-${ts.slice(-6)}-${suffix}`;
}

/* ===========================================================
   CREATE INVOICE
=========================================================== */
export async function createInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId)
      return res.status(401).json({ success: false, message: "Authentication required" });

    const body = req.body || {};
    const items = Array.isArray(body.items)
      ? body.items
      : parseItemsField(body.items);

    const taxPercent = Number(body.taxPercent ?? 0);
    const totals = computeTotals(items, taxPercent);

    // Upload images to Cloudinary
    const logoFile = req.files?.logoName?.[0];
    const stampFile = req.files?.stampName?.[0];
    const signatureFile = req.files?.signatureNameMeta?.[0];

    const logoDataUrl = await uploadToCloudinary(logoFile, "logos");
    const stampDataUrl = await uploadToCloudinary(stampFile, "stamps");
    const signatureDataUrl = await uploadToCloudinary(signatureFile, "signatures");

    const invoiceNumber =
      body.invoiceNumber || (await generateUniqueInvoiceNumber());

    const doc = new Invoice({
      owner: userId,
      invoiceNumber,
      issueDate: body.issueDate || new Date(),
      dueDate: body.dueDate || "",
      client: body.client || {},
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: body.currency || "INR",
      status: body.status ? String(body.status).toLowerCase() : "draft",
      taxPercent,
      logoDataUrl: logoDataUrl || body.logoDataUrl || null,
      stampDataUrl: stampDataUrl || body.stampDataUrl || null,
      signatureDataUrl: signatureDataUrl || body.signatureDataUrl || null,
      notes: body.notes || "",
    });

    const saved = await doc.save();

    return res.status(201).json({
      success: true,
      message: "Invoice created",
      data: saved,
    });

  } catch (err) {
    console.error("createInvoice error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ===========================================================
   GET ALL INVOICES
=========================================================== */
export async function getInvoices(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId)
      return res.status(401).json({ success: false, message: "Authentication required" });

    const invoices = await Invoice.find({ owner: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: invoices });
  } catch (err) {
    console.error("getInvoices error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ===========================================================
   GET BY ID
=========================================================== */
export async function getInvoiceById(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId)
      return res.status(401).json({ success: false, message: "Authentication required" });

    const { id } = req.params;

    const invoice = isObjectIdString(id)
      ? await Invoice.findOne({ _id: id, owner: userId })
      : await Invoice.findOne({ invoiceNumber: id, owner: userId });

    if (!invoice)
      return res.status(404).json({ success: false, message: "Invoice not found" });

    return res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    console.error("getInvoiceById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ===========================================================
   UPDATE INVOICE
=========================================================== */
export async function updateInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId)
      return res.status(401).json({ success: false, message: "Authentication required" });

    const { id } = req.params;
    const body = req.body || {};

    const invoice = await Invoice.findOne({
      _id: id,
      owner: userId,
    });

    if (!invoice)
      return res.status(404).json({ success: false, message: "Invoice not found" });

    const items = Array.isArray(body.items)
      ? body.items
      : parseItemsField(body.items);

    const taxPercent = Number(body.taxPercent ?? invoice.taxPercent ?? 0);
    const totals = computeTotals(items, taxPercent);

    // Upload new images if provided
    const logoFile = req.files?.logoName?.[0];
    const stampFile = req.files?.stampName?.[0];
    const signatureFile = req.files?.signatureNameMeta?.[0];

    if (logoFile)
      invoice.logoDataUrl = await uploadToCloudinary(logoFile, "logos");

    if (stampFile)
      invoice.stampDataUrl = await uploadToCloudinary(stampFile, "stamps");

    if (signatureFile)
      invoice.signatureDataUrl = await uploadToCloudinary(signatureFile, "signatures");

    invoice.items = items;
    invoice.subtotal = totals.subtotal;
    invoice.tax = totals.tax;
    invoice.total = totals.total;
    invoice.taxPercent = taxPercent;
    invoice.notes = body.notes ?? invoice.notes;

    const updated = await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice updated",
      data: updated,
    });

  } catch (err) {
    console.error("updateInvoice error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ===========================================================
   DELETE INVOICE
=========================================================== */
export async function deleteInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId)
      return res.status(401).json({ success: false, message: "Authentication required" });

    const { id } = req.params;

    const deleted = await Invoice.findOneAndDelete({
      _id: id,
      owner: userId,
    });

    if (!deleted)
      return res.status(404).json({ success: false, message: "Invoice not found" });

    return res.status(200).json({
      success: true,
      message: "Invoice deleted",
    });

  } catch (err) {
    console.error("deleteInvoice error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
