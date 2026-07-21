# Diagnostic Center Management - Frontend

React single-page application for the Diagnostic Center Management System.

## Tech Stack

- **Framework**: React 18 (Create React App)
- **UI Library**: Material UI (MUI) v7
- **HTTP Client**: Axios
- **Routing**: React Router v7
- **PDF Generation**: @react-pdf/renderer
- **Date Handling**: date-fns
- **Drag & Drop**: react-beautiful-dnd

## Getting Started

### Prerequisites

- Node.js (v16 or higher)

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

The frontend connects to the backend API at `http://localhost:5001/api` by default.

To change this, set the `REACT_APP_API_URL` environment variable:

```bash
# Create a .env.local file
echo REACT_APP_API_URL=http://your-backend-url/api > .env.local
```

### Running the App

```bash
# Development mode
npm start
```

The app will open at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

The build output will be in the `build/` directory. The backend server can serve this automatically when placed alongside it.

## Application Modules

| Module              | Description                              |
| ------------------- | ---------------------------------------- |
| Dashboard           | Overview with navigation tiles           |
| Patient Entry       | Register patients and assign tests       |
| Create Report       | Enter test results and generate reports  |
| Share Report        | Share/print reports via email or link    |
| Analysis            | Doctor & Agent referral analytics        |
| History             | Patient and report history lookup        |
| Test Settings       | Manage tests, subtests, and packs        |
| Equipment & Kits    | Inventory and stock tracking             |
| Commission          | Doctor/Agent commission management       |
| Accounts & Balance  | Financial summaries                      |

## Project Structure

```
frontend/
├── public/          # Static assets & index.html
├── src/
│   ├── components/  # React components (pages & reusable)
│   ├── contexts/    # React context providers (Auth, Pin)
│   ├── hooks/       # Custom React hooks
│   ├── services/    # Service layer
│   ├── utils/       # Utility functions
│   ├── constants/   # Application constants
│   ├── api.js       # Axios API client & endpoint definitions
│   ├── config.js    # App configuration (API base URL)
│   ├── App.js       # Root component with routing
│   └── index.js     # Application entry point
└── package.json     # Dependencies & scripts
```
