import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // frontend uid
    description: { type: String, required: true },
    qty: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    // store Clerk user id (string) instead of Mongo ObjectId ref
    owner: { type: String, required: true, index: true },

    // invoiceNumber must be unique across collection
    invoiceNumber: { type: String, required: true, index: true },

    issueDate: { type: String, required: true }, // storing ISO date string for simplicity
    dueDate: { type: String, default: "" },

    // From / Business info
    fromBusinessName: { type: String, default: "" },
    fromEmail: { type: String, default: "" },
    fromAddress: { type: String, default: "" },
    fromPhone: { type: String, default: "" },
    fromGst: { type: String, default: "" },

    // Client info
    client: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    items: { type: [ItemSchema], default: [] },

    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["draft", "unpaid", "paid", "overdue"], default: "draft" },

    // small asset blobs / data-urls (frontend uses data URLs for preview; keep optional)
    logoDataUrl: { type: String, default: null },
    stampDataUrl: { type: String, default: null },
    signatureDataUrl: { type: String, default: null },

    signatureName: { type: String, default: "" },
    signatureTitle: { type: String, default: "" },

    taxPercent: { type: Number, default: 18 },

    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
export default Invoice;