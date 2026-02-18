
# 🚀 BillDesk AI Invoice Generator

An AI-powered full-stack invoice management system built using the **MERN Stack**, integrated with **Clerk Authentication**, **Google Gemini AI**, and **Cloudinary Cloud Storage**.

This platform enables users to securely generate professional invoices using AI, manage business profiles, upload branding assets to cloud storage, and maintain user-specific invoice records with complete data isolation.

---

## 🌐 Live Deployment

**Backend API**
🔗 [https://bill-desk-ai-invoice-generator.onrender.com](https://bill-desk-ai-invoice-generator.onrender.com)

**Frontend Application**
🔗 [https://bill-desk-ai-invoice-generator-1.onrender.com](https://bill-desk-ai-invoice-generator-1.onrender.com)

---

## 🛠 Technology Stack

### 🔹 Frontend

* React (Vite)
* React Router
* Clerk Authentication
* Responsive UI Design

### 🔹 Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* Clerk JWT Middleware
* Google Gemini AI Integration
* Cloudinary (Image Storage)

### 🔹 Deployment & Infrastructure

* Frontend → Render (Static Site)
* Backend → Render (Web Service)
* Database → MongoDB Atlas
* Image Storage → Cloudinary

---

## ✨ Core Features

* 🔐 Secure Authentication using Clerk
* 🤖 AI-based Invoice Generation (Gemini API)
* 🧾 Automatic Invoice Number Generation with Collision Handling
* 🏢 Business Profile Management
* ☁️ Cloud-based Image Upload (Logo, Stamp, Signature)
* 📄 Full CRUD Operations for Invoices
* 📊 Automatic Subtotal, Tax & Total Calculation
* 🔎 Search & Filter Invoices
* 🔒 User-based Data Isolation
* 📱 Fully Responsive UI Design

---

## 📂 Project Structure

```
Bill-Desk-AI-Invoice-Generator/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── vite.config.js
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── config/
│   └── index.js
│
└── README.md
```

---

## ⚙️ Environment Variables

### 🔹 Backend (.env)

```
PORT=4000
MONGO_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

---

### 🔹 Frontend (.env)

```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

---

## 🚀 Local Setup Guide

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Tejas978/bill-desk-ai-invoice-generator.git
cd bill-desk-ai-invoice-generator
```

### 2️⃣ Setup Backend

```bash
cd backend
npm install
npm start
```

Backend runs on:

```
http://localhost:4000
```

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 🔐 Security Architecture

* Clerk JWT verification middleware
* Route-level authentication protection
* Owner-based invoice access validation
* Unique invoice number conflict handling
* Secure environment variable management
* Cloud-based asset storage (No local file persistence)

---

## 🧠 AI Integration

The application integrates **Google Gemini AI** to:

* Parse user prompts
* Generate structured invoice JSON
* Automatically populate invoice fields
* Maintain schema validation
* Provide fallback mechanisms for model reliability

---

## ☁️ Cloud Image Handling

To ensure scalability and production readiness:

* Images are uploaded using Multer (memory storage)
* Files are streamed directly to Cloudinary via `upload_stream`
* Secure image URLs are stored in MongoDB
* No local file storage in production

---

## 📈 Future Enhancements

* Payment Gateway Integration
* Subscription Plans
* Email Invoice Delivery
* Invoice Analytics Dashboard
* Multi-currency Support
* Role-based Access Control
* Optimized Invoice PDF Download

---

## 👨‍💻 Author

**Tejas Khaire**
Final Year IT Engineering Student
Mumbai University
Full Stack Developer | MERN Stack + AI

---
## 📜 License

This project is built for educational and portfolio purposes.

