import mongoose from "mongoose";
import path from "path";
import { getAuth } from "@clerk/express";
import Invoice from "../models/invoiceModel.js";

const API_BASE = "http://localhost:4000";

/** Compute subtotal, tax, and total */
function computeTotals(items = [], taxPercent = 0) {
  const safe = Array.isArray(items) ? items.filter(Boolean) : [];
  const subtotal = safe.reduce(
    (s, it) => s + (Number(it.qty || 0) * Number(it.unitPrice || 0)),
    0
  );
  const tax = (subtotal * Number(taxPercent || 0)) / 100;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

/** Parse FormData items */
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
  return val;
}

/** Check if string is ObjectId */
function isObjectIdString(val) {
  return typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val);
}

/** Map multer-uploaded files to public URLs */
function uploadedFilesToUrls(req) {
  const urls = {};
  if (!req.files) return urls;

  const mapping = {
    logoName: "logoDataUrl",
    stampName: "stampDataUrl",
    signatureNameMeta: "signatureDataUrl",
    logo: "logoDataUrl",
    stamp: "stampDataUrl",
    signature: "signatureDataUrl",
  };

  Object.keys(mapping).forEach((field) => {
    const arr = req.files[field];
    if (Array.isArray(arr) && arr[0]) {
      const filename =
        arr[0].filename || (arr[0].path && path.basename(arr[0].path));
      if (filename) urls[mapping[field]] = `${API_BASE}/uploads/${filename}`;
    }
  });

  return urls;
}

/** Generate a collision-resistant invoice number (and check DB for existing) */
async function generateUniqueInvoiceNumber(attempts = 8) {
  // Try multiple times. Use timestamp + random to minimize collisions.
  for (let i = 0; i < attempts; i++) {
    // include date and random suffix
    const ts = Date.now().toString();
    const suffix = Math.floor(Math.random() * 900000).toString().padStart(6, "0");
    const candidate = `INV-${ts.slice(-6)}-${suffix}`;

    // quick existence check
    /* eslint-disable no-await-in-loop */
    const exists = await Invoice.exists({ invoiceNumber: candidate });
    if (!exists) return candidate;
    /* eslint-enable no-await-in-loop */

    // small delay then retry (very short)
    await new Promise((r) => setTimeout(r, 2));
  }

  // fallback: use ObjectId string (guaranteed unique)
  return new mongoose.Types.ObjectId().toString();
}

/* ----------------- CREATE ----------------- */
export async function createInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const body = req.body || {};
    const items = Array.isArray(body.items)
      ? body.items
      : parseItemsField(body.items);
    const taxPercent = Number(
      body.taxPercent ?? body.tax ?? body.defaultTaxPercent ?? 0
    );
    const totals = computeTotals(items, taxPercent);
    const fileUrls = uploadedFilesToUrls(req);

    // If client supplied invoiceNumber, ensure it doesn't already exist
    let invoiceNumberProvided =
      typeof body.invoiceNumber === "string" && body.invoiceNumber.trim()
        ? String(body.invoiceNumber).trim()
        : null;

    if (invoiceNumberProvided) {
      const duplicate = await Invoice.exists({ invoiceNumber: invoiceNumberProvided });
      if (duplicate) {
        return res
          .status(409)
          .json({ success: false, message: "Invoice number already exists" });
      }
    }

    // generate a unique invoice number (or use provided)
    let invoiceNumber = invoiceNumberProvided || (await generateUniqueInvoiceNumber());

    // Build document
    const doc = new Invoice({
      _id: new mongoose.Types.ObjectId(),
      owner: userId, // associate invoice with Clerk userId
      invoiceNumber,
      issueDate: body.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: body.dueDate || "",
      fromBusinessName: body.fromBusinessName || "",
      fromEmail: body.fromEmail || "",
      fromAddress: body.fromAddress || "",
      fromPhone: body.fromPhone || "",
      fromGst: body.fromGst || "",
      client:
        typeof body.client === "string" && body.client.trim()
          ? { name: body.client }
          : body.client || {},
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: body.currency || "INR",
      status: body.status ? String(body.status).toLowerCase() : "draft",
      taxPercent,
      logoDataUrl:
        fileUrls.logoDataUrl || body.logoDataUrl || body.logo || null,
      stampDataUrl:
        fileUrls.stampDataUrl || body.stampDataUrl || body.stamp || null,
      signatureDataUrl:
        fileUrls.signatureDataUrl ||
        body.signatureDataUrl ||
        body.signature ||
        null,
      signatureName: body.signatureName || "",
      signatureTitle: body.signatureTitle || "",
      notes: body.notes || body.aiSource || "",
    });

    // Save with retry on duplicate-key (race conditions)
    let saved = null;
    let attempts = 0;
    const maxSaveAttempts = 6;
    while (attempts < maxSaveAttempts) {
      try {
        saved = await doc.save();
        break; // success
      } catch (err) {
        // If duplicate invoiceNumber (race), regenerate and retry
        if (err && err.code === 11000 && err.keyPattern && err.keyPattern.invoiceNumber) {
          attempts += 1;
          // generate a new invoiceNumber and set on doc
          const newNumber = await generateUniqueInvoiceNumber();
          doc.invoiceNumber = newNumber;
          // loop to try save again
          continue;
        }
        // other errors → rethrow
        throw err;
      }
    }

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: "Failed to create invoice after multiple attempts",
      });
    }

    return res
      .status(201)
      .json({ success: true, message: "Invoice created", data: saved });
  } catch (err) {
    console.error("createInvoice error:", err);
    if (err.type === "entity.too.large") {
      return res
        .status(413)
        .json({ success: false, message: "Payload too large" });
    }
    // handle duplicate key at top-level just in case
    if (err && err.code === 11000 && err.keyPattern && err.keyPattern.invoiceNumber) {
      return res
        .status(409)
        .json({ success: false, message: "Invoice number already exists" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ----------------- LIST ----------------- */
export async function getInvoices(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const q = { owner: userId }; // restrict to user invoices
    if (req.query.status) q.status = req.query.status;
    if (req.query.invoiceNumber) q.invoiceNumber = req.query.invoiceNumber;

    if (req.query.search) {
      const search = req.query.search.trim();
      q.$or = [
        { fromEmail: { $regex: search, $options: "i" } },
        { "client.email": { $regex: search, $options: "i" } },
        { "client.name": { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(q).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
  console.error("CREATE INVOICE ERROR:", error);

  res.status(500).json({
    success: false,
    message: error.message,
    stack: error.stack, // remove later in production
  });
}

}

/* ----------------- GET BY ID ----------------- */
export async function getInvoiceById(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const { id } = req.params;
    let inv;
    if (isObjectIdString(id)) inv = await Invoice.findById(id);
    else inv = await Invoice.findOne({ invoiceNumber: id });

    if (!inv)
      return res.status(404).json({ success: false, message: "Invoice not found" });

    if (inv.owner && String(inv.owner) !== String(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Not your invoice" });
    }

    return res.status(200).json({ success: true, data: inv });
  } catch (err) {
    console.error("getInvoiceById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ----------------- UPDATE ----------------- */
export async function updateInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const { id } = req.params;
    const body = req.body || {};

    // locate invoice first (must belong to user)
    const query = isObjectIdString(id)
      ? { _id: id, owner: userId }
      : { invoiceNumber: id, owner: userId };

    const existing = await Invoice.findOne(query);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found or not yours" });
    }

    // If client is changing the invoiceNumber, ensure the new number isn't used by another invoice
    if (body.invoiceNumber && String(body.invoiceNumber).trim() !== existing.invoiceNumber) {
      const conflict = await Invoice.findOne({ invoiceNumber: String(body.invoiceNumber).trim() });
      if (conflict && String(conflict._id) !== String(existing._id)) {
        return res
          .status(409)
          .json({ success: false, message: "Invoice number already exists" });
      }
    }

    let items = [];
    if (Array.isArray(body.items)) items = body.items;
    else if (typeof body.items === "string" && body.items.length) {
      try {
        items = JSON.parse(body.items);
      } catch {
        items = [];
      }
    }

    const taxPercent = Number(
      body.taxPercent ?? body.tax ?? body.defaultTaxPercent ?? existing.taxPercent ?? 0
    );
    const totals = computeTotals(items, taxPercent);
    const fileUrls = uploadedFilesToUrls(req);

    const update = {
      invoiceNumber: body.invoiceNumber,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      fromBusinessName: body.fromBusinessName,
      fromEmail: body.fromEmail,
      fromAddress: body.fromAddress,
      fromPhone: body.fromPhone,
      fromGst: body.fromGst,
      client:
        typeof body.client === "string" && body.client.trim()
          ? { name: body.client }
          : body.client || existing.client || {},
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: body.currency,
      status: body.status ? String(body.status).toLowerCase() : undefined,
      taxPercent,
      logoDataUrl:
        fileUrls.logoDataUrl ||
        (body.logoDataUrl || body.logo) ||
        undefined,
      stampDataUrl:
        fileUrls.stampDataUrl ||
        (body.stampDataUrl || body.stamp) ||
        undefined,
      signatureDataUrl:
        fileUrls.signatureDataUrl ||
        (body.signatureDataUrl || body.signature) ||
        undefined,
      signatureName: body.signatureName,
      signatureTitle: body.signatureTitle,
      notes: body.notes,
    };

    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const updated = await Invoice.findOneAndUpdate(
      { _id: existing._id }, // ensure update by _id to avoid surprises
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updated)
      return res
        .status(500)
        .json({ success: false, message: "Failed to update invoice" });

    return res
      .status(200)
      .json({ success: true, message: "Invoice updated", data: updated });
  } catch (err) {
    console.error("updateInvoice error:", err);
    if (err && err.code === 11000 && err.keyPattern && err.keyPattern.invoiceNumber) {
      return res
        .status(409)
        .json({ success: false, message: "Invoice number already exists" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ----------------- DELETE ----------------- */
export async function deleteInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const { id } = req.params;

    const query = isObjectIdString(id)
      ? { _id: id, owner: userId }
      : { invoiceNumber: id, owner: userId };

    const found = await Invoice.findOne(query);
    if (!found)
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found or not yours" });

    await Invoice.deleteOne({ _id: found._id });
    return res.status(200).json({ success: true, message: "Invoice deleted" });
  } catch (err) {
    console.error("deleteInvoice error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}