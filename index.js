const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const express = require("express");

const app = express();
const port = process.env.PORT || 9090;

// HTML status route
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KHAN BOT | STATUS</title>
      <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Roboto Mono', monospace;
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          color: #ffffff;
        }
        .card {
          background: rgba(0, 0, 0, 0.6);
          padding: 30px 25px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(0, 255, 128, 0.3);
          border: 1px solid #00ff99;
          width: 90%;
          max-width: 420px;
          animation: fadeInUp 1.2s ease-out;
        }
        .card h1 {
          font-size: 1.8rem;
          color: #00ff99;
          margin-bottom: 10px;
        }
        .card p {
          font-size: 1rem;
          color: #cccccc;
        }
        .status-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          background-color: #00ff99;
          border-radius: 50%;
          margin-right: 8px;
          vertical-align: middle;
          animation: pulse 1.2s infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 480px) {
          .card { padding: 20px 15px; }
          .card h1 { font-size: 1.4rem; }
          .card p { font-size: 0.95rem; }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1><span class="status-dot"></span> KHAN BOT IS RUNNING</h1>
        <p>KHAN MD POWERED BY JAWADTECH.</p>
      </div>
    </body>
    </html>
  `);
});

// Start web server
app.listen(port, () => {
    console.log(`[🌐] Server listening on http://localhost:${port}`);
});

// ==================== GARBAGE COLLECTION ====================
setInterval(() => {
    if (global.gc) {
        global.gc();
        console.log('🧹 Garbage collection completed');
    }
}, 60000);

// ==================== BOT LOADING LOGIC ====================
const repoZipUrl = 'https://github.com/Ai-CoderX/A/archive/refs/heads/main.zip';
const repoFolder = path.join(__dirname, 'khanmd_temp');

async function downloadAndExtractRepo() {
  try {
    console.log('🔄 Loading KHAN-MD Files...');
    const response = await axios.get(repoZipUrl, { responseType: 'arraybuffer' });
    const zip = new AdmZip(Buffer.from(response.data, 'binary'));
    
    if (fs.existsSync(repoFolder)) {
      fs.rmSync(repoFolder, { recursive: true, force: true });
    }
    
    fs.mkdirSync(repoFolder, { recursive: true });
    zip.extractAllTo(repoFolder, true);
    console.log('✅ Bot files extracted successfully');
    
  } catch (error) {
    console.error('❌ Error Loading file:', error.message);
    process.exit(1);
  }
}

(async () => {
  await downloadAndExtractRepo();

  const extractedFolders = fs
    .readdirSync(repoFolder)
    .filter(f => fs.statSync(path.join(repoFolder, f)).isDirectory());

  if (!extractedFolders.length) {
    console.error('❌ No folder found in extracted content');
    process.exit(1);
  }

  const extractedRepoPath = path.join(repoFolder, extractedFolders[0]);

  const srcSettings = path.join(__dirname, 'settings.js');
  const destSettings = path.join(extractedRepoPath, 'settings.js');

  if (fs.existsSync(srcSettings)) {
    try {
      fs.copyFileSync(srcSettings, destSettings);
      console.log('✅ settings copied successfully');
    } catch (err) {
      console.error('❌ Failed to copy settings:', err.message);
      process.exit(1);
    }
  } else {
    console.error('❌ settings not found in current directory');
    process.exit(1);
  }

  // FIX: Use dynamic import() instead of require() for ESM compatibility
  setTimeout(async () => {
    console.log('🚀 Successfully complete now Starting KHAN-BOT...');
    try {
      process.chdir(extractedRepoPath);
      
      // Dynamic import for ESM module
      const botModule = await import(path.join(extractedRepoPath, 'index.js'));
      
      // If the module exports a start function, call it
      if (botModule.startServer) {
        await botModule.startServer();
      } else if (botModule.default && botModule.default.startServer) {
        await botModule.default.startServer();
      }
      
    } catch (err) {
      console.error('❌ Error while launching index.js:', err.message);
      process.exit(1);
    }
  }, 4000);
})();
