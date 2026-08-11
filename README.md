# E-Commerce-for-shopping-

# 🛍️ Trend Mart

**Trend Mart** is a modern men's fashion e-commerce website designed to simplify online product discovery and order processing through **WhatsApp**.

Customers can browse products, view complete product details, get support through an AI chat assistant, and place orders directly through WhatsApp. Orders can then be managed and tracked through a dedicated admin panel.

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
* 🤖 AI-powered customer chat support
* 💬 Customer support through **LiveChatAI.com**
* 🧠 AI chatbot can be customized with Trend Mart's own website information
* 📢 Promotional banners
* 🎉 Festival/event popup posters
* 📅 Scheduled banners and popup campaigns using start and end dates

---

## 🤖 AI Chat Support

Trend Mart includes AI-powered customer support using **LiveChatAI.com**.

The chatbot can be customized with Trend Mart's own website information so customers can get answers related to the store.

The chatbot can use Trend Mart information such as:

* 🛍️ Product information
* 💰 Product pricing
* 📦 Order information
* 🚚 Store/order policies
* 📱 WhatsApp ordering process
* 🏪 Trend Mart business information
* ❓ Frequently asked questions
* 📋 Other important website details

### 🗄️ Database-Based Chat Knowledge

Chat support information can be managed through the **Admin Panel** and stored in the database.

Admins can:

* ➕ Add new chatbot information
* ✏️ Edit existing chatbot information
* 🗑️ Remove outdated information
* 📚 Add FAQs and store information
* 📝 Update product/store-related information used by the chatbot
* 🔄 Keep the chatbot knowledge up to date without changing the website code

This allows Trend Mart to maintain its AI customer support information from the admin panel.

**Chat Support Provider:** LiveChatAI.com

---

## 🔐 Admin Panel

The admin panel provides complete control over the store.

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
* 📱 Process orders received through WhatsApp

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

### 🤖 Chat Support Management

* 💬 Manage AI chat support information
* 🗄️ Store chatbot knowledge in the database
* ➕ Add new chatbot knowledge
* ✏️ Edit chatbot information
* 🗑️ Delete outdated information
* ❓ Manage frequently asked questions
* 📚 Add Trend Mart business information
* 🔄 Update information used by the AI chatbot

---

## 🔄 Order Workflow

```text
Customer
   │
   ▼
Browse Products
   │
   ├──────────────► AI Chat Support
   │                │
   │                ▼
   │          Get Store Information
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
     └── Chat Support
           ├── Add Knowledge
           ├── Edit Knowledge
           ├── Delete Knowledge
           ├── Manage FAQs
           └── Update AI Information
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

| Section          | Admin Control                     |
| ---------------- | --------------------------------- |
| Products         | Add, edit, delete, update         |
| Images           | Upload/change product images      |
| Descriptions     | Add/edit descriptions             |
| Prices           | Update prices                     |
| Orders           | View and manage                   |
| Order Status     | Update processing status          |
| Reports          | View and analyse data             |
| Banners          | Add/edit/schedule                 |
| Festival Posters | Add/edit/schedule                 |
| Chat Support     | Add/edit/delete chatbot knowledge |
| Chatbot FAQs     | Manage frequently asked questions |
| Campaign Dates   | Start & end date                  |

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

The project is built with web technologies and an admin management system.

* HTML
* CSS
* JavaScript
* Supabase
* Database-driven content management
* WhatsApp integration
* LiveChatAI.com
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
* Chatbot knowledge
* Chatbot FAQs
* Store information used by AI support
* Reports and analytics data

---

## 🌟 Main Highlights

* 📱 WhatsApp-based ordering
* 🤖 AI-powered customer chat support
* 💬 LiveChatAI.com integration
* 🧠 Custom AI knowledge for Trend Mart
* 🗄️ Database-based chatbot knowledge
* 🔐 Admin management panel
* 💬 Admin-managed chat support content
* 📦 Order status management
* 📊 Reports and analytics
* 🛍️ Product management
* 🖼️ Image and description management
* 📢 Promotional banner management
* 🎉 Festival popup management
* 📅 Date-based campaign scheduling
* ☁️ Supabase backend
* 💻 Responsive web interface

---

## 🎯 Project Goal

The goal of Trend Mart is to provide a simple and practical online shopping experience where customers can discover products, get AI-powered support, and place orders through WhatsApp, while the store owner can manage products, orders, promotions, chatbot information, and reports from a centralized admin panel.

---

## 📌 Project Status

**🚧 Active Development**

New features and improvements are continuously being added to Trend Mart.

