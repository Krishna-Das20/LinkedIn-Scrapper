# LinkedIn Profile Scraper & Visualizer 🕵️‍♂️

A powerful, stealthy LinkedIn profile scraper built with **Playwright**, **Node.js**, and **React**. This tool extracts comprehensive profile data (including deep-nested sections like projects and interests) and visualizes it in a stunning, modern UI.

![Profile Visualization](./frontend/public/preview.png)

## 🚀 Key Features

-   **Stealth Mode:** Uses `playwright-extra` and `puppeteer-extra-plugin-stealth` to evade detection.
-   **Deep Scraping:** Navigates to dedicated detail pages (`/details/experience`, `/details/projects`, etc.) to capture **all** items, not just the top few.
-   **Session Persistence:** Saves cookies and browser state to `user_data` to minimize login prompts and ban risk.
-   **Headless Operation:** Configurable headless mode for production environments.
-   **Modern UI:** A beautiful React frontend with glassmorphism design, dark mode, and responsive layout.
-   **Robust Extractors:** Handles LinkedIn's Server-Driven UI (SDUI) dynamic classes and structure changes.

## 🛠️ Tech Stack

-   **Frontend:** React, Vite, CSS Modules (Glassmorphism layout)
-   **Backend:** Node.js, Express
-   **Scraping:** Playwright, Playwright-Extra
-   **Utils:** Axios, Cheerio (for some static parsing)

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/linkedin-scraper.git
cd linkedin-scraper
```

### 2. Install Dependencies
**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Configuration
Create a `.env` file in the `backend` directory:
```env
# Server
PORT=5000

# Playwright
HEADLESS=true  # Set to false for debugging (visual browser)

# LinkedIn Credentials (Optional for automated login, but Manual Login is recommended for safety)
# LINKEDIN_EMAIL=your_email@example.com
# LINKEDIN_PASSWORD=your_password
```

## 🏃‍♂️ Usage

### 1. Start the Backend
```bash
cd backend
node server.js
```
*On first run, if `HEADLESS=false`, a browser window will open. Log in to LinkedIn manually if automated login is not configured. The session will be saved to `user_data`.*

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Scrape a Profile
1.  Open `http://localhost:5173` in your browser.
2.  Enter a LinkedIn Profile URL (e.g., `https://www.linkedin.com/in/username/`).
3.  Click **Scrape**.
4.  Wait for the process to complete (can take ~2-3 minutes for full deep scraping).
5.  View the visualized data!

## 📂 Project Structure

```
├── backend/
│   ├── components/         # Reusable UI components
│   ├── services/
│   │   ├── scraper.service.js  # Main orchestrator
│   │   ├── browser.service.js  # Playwright & Stealth config
│   │   └── extractors/         # Individual section extractors
│   │       ├── profile.extractor.js
│   │       ├── experience.extractor.js
│   │       ├── projects.extractor.js
│   │       └── ...
│   ├── routes/             # API routes
│   └── server.js           # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/     # React components (ProfileHeader, DataSections)
    │   ├── services/       # API client
    │   └── App.jsx         # Main application logic
    └── vite.config.js
```

## ⚠️ Disclaimer

This tool is for **educational purposes only**. Scraping LinkedIn profiles may violate their Terms of Service. Use responsibly and at your own risk. The authors are not responsible for any account bans or legal issues arising from the use of this tool.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
