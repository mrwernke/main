# SAT Math Prep

This project is a standalone SAT Math Prep application that can run locally without the original Base44 backend. In development it uses a browser-based local storage fallback for students, questions, settings, and other data.

## Prerequisites

1. Install Node.js 20+.
2. In the project directory, install dependencies:

```bash
npm install
```

## Run Locally

Start the Vite dev server:

```bash
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://localhost:5173/
```

## Optional remote backend

If you later connect this app to a hosted database or authentication provider, you can add a local env file with:

```bash
VITE_USE_BASE44=true
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.example.com
```

The app will only use the remote client when that flag is enabled.
