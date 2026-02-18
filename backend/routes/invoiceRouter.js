// routes/invoiceRouter.js
import express from "express";
import { requireAuth } from "@clerk/express";

import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from "../controllers/invoiceController.js";

const invoiceRouter = express.Router();

//  Protect ALL routes
invoiceRouter.use(requireAuth());

invoiceRouter.get("/", getInvoices);
invoiceRouter.get("/:id", getInvoiceById);
invoiceRouter.post("/", createInvoice);
invoiceRouter.put("/:id", updateInvoice);
invoiceRouter.delete("/:id", deleteInvoice);

export default invoiceRouter;
