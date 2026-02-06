# 📊 Flexi Leads Tracker

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg)

**A modern, powerful CRM dashboard powered by Google Sheets**

[Features](#-features) • [Demo](#-demo) • [Quick Start](#-quick-start) • [Setup](#️-setup-guide) • [Tech Stack](#-tech-stack)

</div>

---

## ✨ Features

### 🎯 Core Functionality
- ✅ **Full CRUD Operations** - Create, Read, Update, Delete records seamlessly
- ✅ **Google Sheets Integration** - Use Google Sheets as your database
- ✅ **Duplicate Prevention** - Smart validation for Loan Code, Application ID, Mobile Number
- ✅ **Advanced Search** - Multi-criteria search functionality
- ✅ **Real-time Analytics** - Today's count vs Total count comparison
- ✅ **Auto-refresh** - Data updates every 30 seconds automatically

### 🎨 Modern UI/UX
- 🌓 **Light/Dark Mode** - Beautiful themes with persistent preference
- 📱 **Fully Responsive** - Works flawlessly on all devices
- ✨ **Smooth Animations** - Professional micro-interactions
- 🎭 **Emoji Icons** - Clean, modern iconography
- 🎨 **Gradient Design** - Eye-catching color schemes

### 📊 Analytics Dashboard
- 📈 **Status Count Table** - Today vs Total comparison
- 📋 **Today's Records** - Real-time display of today's entries
- 🔍 **Search Results** - Instant filtered data display
- 🎯 **Status Tracking** - Doc Pending, Hot Lead, Recheck, Pending, AWH

---

## 🎯 Quick Start

### 1️⃣ Setup Google Sheet
Create a Google Sheet with these exact headers:
```
Timestamp | Loan Code | Application ID | Name | Mobile Number | Status | Sub-Status | Remarks
```

### 2️⃣ Deploy Google Apps Script
1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Copy code from `google-apps-script.js`
4. Update `SHEET_ID` and `SHEET_NAME`
5. Deploy as **Web App** (Execute as: Me, Access: Anyone)
6. Copy the Web App URL

### 3️⃣ Configure Frontend
Update `SCRIPT_URL` in `script.js`:
```javascript
const SCRIPT_URL = 'your-web-app-url-here';
```

### 4️⃣ Launch
Open `index.html` in your browser and start tracking! 🎉

---

## 🛠️ Setup Guide

### Prerequisites
- Google Account
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of Google Sheets

### Detailed Installation

#### Step 1: Clone Repository
```bash
git clone https://github.com/mainly-vishwajeet/flexi_leads_tracker.git
cd flexi_leads_tracker
```

#### Step 2: Google Sheet Setup
1. Create a new Google Sheet
2. Add column headers (see Quick Start)
3. Note your Sheet ID from URL: `docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

#### Step 3: Apps Script Deployment
1. In Google Sheet: **Extensions** → **Apps Script**
2. Delete default code
3. Paste code from `google-apps-script.js`
4. Update configuration:
```javascript
const SHEET_ID = 'your-sheet-id-here';
const SHEET_NAME = 'Sheet1'; // or your sheet name
```
5. Click **Deploy** → **New deployment**
6. Select type: **Web app**
7. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy** and authorize
9. Copy the Web App URL

#### Step 4: Frontend Configuration
Open `script.js` and update:
```javascript
const SCRIPT_URL = 'your-copied-web-app-url';
```

#### Step 5: Run Application
Simply open `index.html` in your browser!

---

## 📋 Status Options

### Status Values
- 📄 **Doc Pending** - Documents pending
- 🔥 **Hot Lead** - High priority leads
- 🔄 **Recheck** - Needs verification
- ⏳ **Pending** - In progress
- ✅ **AWH** - Approved/Waiting for handover

### Sub-Status Values
- Mudra
- SE
- HIGH ABC
- Normal
- Auto HL
- Force HL
- Post HL

---

## 💻 Tech Stack

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with custom properties
- **JavaScript (ES6+)** - Logic and interactions

### Backend
- **Google Apps Script** - Server-side logic
- **Google Sheets API** - Database operations

### Design
- **CSS Grid & Flexbox** - Responsive layouts
- **CSS Custom Properties** - Theme management
- **Emoji Icons** - Modern iconography

---

## 📁 Project Structure

```
flexi_leads_tracker/
├── index.html              # Main application
├── styles.css              # Styling & themes
├── script.js               # Frontend logic
├── google-apps-script.js   # Backend API
├── README.md              # Documentation
└── LICENSE                # MIT License
```

---

## 🎨 Features Breakdown

### 🔐 Security
- ✅ Duplicate prevention
- ✅ Input validation (client & server)
- ✅ Safe deletion with confirmation
- ✅ Error handling

### 📊 Analytics
- ✅ Real-time status counts
- ✅ Today vs Total comparison
- ✅ Auto-refresh every 30 seconds
- ✅ Visual status indicators

### 🎯 User Experience
- ✅ One-click operations
- ✅ Instant search results
- ✅ Loading indicators
- ✅ Success/error messages
- ✅ Responsive design

---

## 🌐 Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome  | ✅ Yes    |
| Firefox | ✅ Yes    |
| Safari  | ✅ Yes    |
| Edge    | ✅ Yes    |
| Mobile  | ✅ Yes    |

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Use Cases

- 💼 **CRM Systems** - Customer relationship management
- 📚 **Lead Management** - Track and manage leads
- 🎓 **College Projects** - Learning and demonstration
- 🏢 **Small Business** - Internal tracking tools
- 🔬 **Prototyping** - Quick MVP development

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer

<div align="center">

**Developed with ❤️ by [Vishwajeet](https://mainly_vishwajeet.netlify.app)**

[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-blue?style=for-the-badge)](https://mainly_vishwajeet.netlify.app)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black?style=for-the-badge&logo=github)](https://github.com/mainly-vishwajeet)

</div>

---

## 🙏 Acknowledgments

- Google Apps Script for backend functionality
- Modern CSS techniques for styling
- Open source community for inspiration

---

## 📞 Support

If you like this project, please ⭐ star the repository!

For issues and questions, please open an [issue](https://github.com/mainly-vishwajeet/flexi_leads_tracker/issues).

---

<div align="center">

**© 2026 Flexi Leads Tracker | Made with ❤️**

</div>
