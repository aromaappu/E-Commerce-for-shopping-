# E- Commerce for online shopping 


# 🛍️ Trend Mart

**Trend Mart** is a modern men's fashion e-commerce website designed to simplify online product discovery and order processing through **WhatsApp**.

Customers can browse products, view product details, get customer support through an AI chatbot, and place orders directly through WhatsApp. The store can be managed through a dedicated admin panel with product management, order management, reports, promotions, and a custom database-connected admin chat assistant.

---

## 🚀 Features

### 👤 Customer Side

* 🛍️ Browse available products
* 🔎 View product details
* 🖼️ Product images and descriptions
* 💰 View product prices
* 📱 **Buy Now** button
* 💬 Automatically redirect customers to WhatsApp with the order message
* 📦 Order details sent directly to the Trend Mart WhatsApp account
* 🤖 Customer-side AI chat support
* 📢 Promotional banners
* 🎉 Festival/event popup posters
* 📅 Scheduled banners and popup campaigns using start and end dates

---

## 🤖 Customer AI Chat Support

Trend Mart includes a **customer-facing AI chat support bot** using **LiveChatAI.com**.

The chatbot can be trained with Trend Mart's own website and business information.

### 🧠 LiveChatAI.com Training

The store owner can add Trend Mart information to LiveChatAI.com so the customer chatbot can provide relevant support.

Information can include:

* 🏪 Trend Mart business details
* 🛍️ Product information
* 💰 Product details and pricing
* 📦 Ordering information
* 📱 WhatsApp ordering process
* 🚚 Delivery information
* 📋 Store policies
* ❓ Frequently asked questions
* 📞 Customer support information
* 📄 Other important website information

The information can be updated in LiveChatAI.com whenever the store's information changes.

**Chat Support:** [LiveChatAI.com](https://www.livechatai.com/?utm_source=chatgpt.com)

> Add your own website/store details to LiveChatAI.com and train the customer-support chatbot with your information.

This chatbot is used **only for customer-side support**.

---

## 🤖 Custom Admin Database Chat

Trend Mart has a **separate custom chatbot created specifically for the Admin Panel**.

This chatbot is **not LiveChatAI.com** and does **not connect to LiveChatAI.com**.

The custom admin bot is connected directly to the Trend Mart database and allows the admin to ask questions about store data using natural language.

### 🗄️ Database-Powered Queries

The admin can ask questions such as:

```text
Which orders were placed today?

How many orders do we have?

How many pending orders are there?

Which orders are completed?

What products were ordered today?

Show today's orders.

How many orders are pending?

Which products have been ordered the most?
```

The custom bot processes the admin's question, accesses the relevant Trend Mart database information, and returns an answer based on the available data.

### 🔄 Custom Admin Bot Flow

```text
Admin
  │
  ▼
Ask Question
  │
  ▼
Custom Admin Chat Bot
  │
  ▼
Trend Mart Database
  │
  ▼
Read Relevant Data
  │
  ▼
Process Query
  │
  ▼
Return Answer
```

### 🔒 Separate Chat Systems

```text
CUSTOMER SIDE
     │
     ▼
LiveChatAI.com
     │
     ▼
Customer Support


ADMIN SIDE
     │
     ▼
Custom Trend Mart Bot
     │
     ▼
Trend Mart Database
     │
     ▼
Store Data / Order Queries
```

The **custom admin bot does not use or connect to LiveChatAI.com**.

---

## 🔐 Admin Panel

The admin panel provides centralized control over the Trend Mart store.

### 📦 Product Management

* ➕ Add new products
* ✏️ Edit existing products
* 🖼️ Change product images
* 📝 Update product descriptions
* 💰 Update product prices
* 🗑️ Remove products
* 🔄 Manage product availability

### 📋 Order Management

* 👀 View customer orders
* 📦 View order details
* 🔄 Change order status
* 📊 Monitor order progress
* 📱 Manage orders received through WhatsApp

### 📊 Reports & Analytics

* 📈 View order reports
* 📊 Analyse sales/order data
* 🔢 Track order counts
* 📦 Monitor order status
* 💰 Analyse store performance

### 🎨 Banner Management

* ➕ Add promotional banners
* 🖼️ Change banner images
* 🔗 Add banner links
* 📅 Set banner start date
* 📅 Set banner end date
* ⏰ Automatically show/hide banners based on the scheduled date

### 🎉 Festival Popup Management

* ➕ Add festival/event popup posters
* 🖼️ Change popup images
* 🔗 Add popup links
* 📅 Set start date
* 📅 Set end date
* ⏰ Automatically display the popup only during the configured period

### 🤖 Custom Admin Chat

* 💬 Ask questions about store data
* 🗄️ Connect directly to the Trend Mart database
* 📦 Query order information
* 📊 Analyse available store data
* 🔎 Find specific information
* 📅 Ask date-based questions
* 📈 Get database-based answers
* 🤖 Use natural-language questions

---

## 🔄 Customer Order Workflow

```text
Customer
   │
   ▼
Browse Products
   │
   ├──────────────► LiveChatAI.com
   │                │
   │                ▼
   │          Customer Support
   │
   ▼
View Product
   │
   ▼
Press "Buy Now"
   │
   ▼
WhatsApp Opens
   │
   ▼
Pre-filled Order Message
   │
   ▼
Customer Sends Order
   │
   ▼
Trend Mart Receives Order
   │
   ▼
Admin Updates Order Status
   │
   ▼
Order Processing
```

---

## 🛠️ Admin Workflow

```text
Admin Login
     │
     ├── Products
     │     ├── Add Product
     │     ├── Edit Product
     │     ├── Change Image
     │     ├── Change Description
     │     └── Manage Availability
     │
     ├── Orders
     │     ├── View Orders
     │     └── Update Status
     │
     ├── Reports
     │     └── Analyse Orders & Sales
     │
     ├── Banners
     │     ├── Add Banner
     │     ├── Edit Banner
     │     └── Schedule Banner
     │
     ├── Festival Popups
     │     ├── Add Poster
     │     ├── Edit Poster
     │     └── Schedule Popup
     │
     └── Custom Admin Chat
           ├── Ask Questions
           ├── Query Orders
           ├── Analyse Data
           └── Get Database Answers
```

---

## 📱 WhatsApp Ordering

Trend Mart uses WhatsApp as the primary order communication channel.

When a customer clicks **Buy Now**, the website automatically opens WhatsApp with a pre-filled message containing the required product/order information.

Example:

```text
Hello Trend Mart,

I would like to order:

Product: Men's Casual Shirt
Price: ₹799
Product ID: TM102

Please confirm my order.
```

The customer simply sends the message through WhatsApp to complete the order request.

---

## 🎯 Store Management

The admin panel allows Trend Mart to operate without directly modifying the website code.

Admins can manage:

| Section           | Admin Control                |
| ----------------- | ---------------------------- |
| Products          | Add, edit, delete, update    |
| Images            | Upload/change product images |
| Descriptions      | Add/edit descriptions        |
| Prices            | Update prices                |
| Orders            | View and manage              |
| Order Status      | Update processing status     |
| Reports           | View and analyse data        |
| Banners           | Add/edit/schedule            |
| Festival Posters  | Add/edit/schedule            |
| Custom Admin Chat | Query and analyse store data |
| Campaign Dates    | Start & end date             |

---

## 📅 Scheduled Promotions

Trend Mart supports date-based promotional content.

For example:

```text
Festival Popup

Start Date: 01/10/2026
End Date:   10/10/2026
```

The popup can automatically become active during the configured period and stop displaying after the end date.

The same scheduling system can be used for promotional banners.

---

## 🧑‍💻 Technology

The project is built using:

* HTML
* CSS
* JavaScript
* Supabase
* Database integration
* WhatsApp integration
* LiveChatAI.com
* Custom database-connected admin chatbot
* GitHub

---

## 🗄️ Data Management

Supabase is used to manage the application's backend data.

The database can store information such as:

* Products
* Product images
* Product descriptions
* Prices
* Orders
* Order status
* Banners
* Festival popup campaigns
* Campaign start/end dates
* Reports and analytics data

The custom admin chatbot can access relevant database information to answer admin questions about the store.

---

## 🤖 Two Separate Chat Systems

Trend Mart uses **two independent chat systems with completely different purposes**.

| Chat System          | Location      | Purpose                                        | Connection          |
| -------------------- | ------------- | ---------------------------------------------- | ------------------- |
| **LiveChatAI.com**   | Customer Side | Customer support and website/store information | LiveChatAI.com      |
| **Custom Admin Bot** | Admin Panel   | Query and analyse Trend Mart database data     | Trend Mart Database |

### 1. Customer Chat — LiveChatAI.com

* Customer-facing
* Used for customer support
* Trained with Trend Mart website/store information
* Managed through LiveChatAI.com
* Completely separate from the admin database bot

**Website:** [LiveChatAI.com](https://www.livechatai.com/?utm_source=chatgpt.com)

### 2. Admin Chat — Custom Trend Mart Bot

* Admin-facing
* Custom bot created for Trend Mart
* Connected directly to the Trend Mart database
* Used for natural-language database queries
* Can answer questions about orders, products, dates, and other available store data
* **Not connected to LiveChatAI.com**

---

## 🌟 Main Highlights

* 📱 WhatsApp-based ordering
* 🤖 Customer AI chat support
* 💬 LiveChatAI.com integration
* 🧠 Train customer chatbot with Trend Mart website/store information
* 🤖 Custom admin database chatbot
* 🗄️ Direct database-connected admin chat
* 🔎 Natural-language database queries
* 📦 Order status management
* 🔐 Admin management panel
* 📊 Reports and analytics
* 🛍️ Product management
* 🖼️ Image and description management
* 📢 Promotional banner management
* 🎉 Festival popup management
* 📅 Date-based campaign scheduling
* ☁️ Supabase backend
* 💻 Responsive web interface

---

# Preview of the website : http://trendfashionclub.netlify.app/

## 🎯 Project Goal

The goal of Trend Mart is to provide a practical online shopping experience where customers can discover products, get AI-powered support, and place orders through WhatsApp.

At the same time, the store owner can manage products, orders, promotions, reports, and database information through a centralized admin panel with a **custom database-connected chat assistant**.

The customer-side **LiveChatAI.com** chatbot and the admin-side **custom database chatbot are completely separate systems** designed for different purposes.

---

## 📌 Project Status

**🚧 Active Development**

New features and improvements are continuously being added to Trend Mart.
