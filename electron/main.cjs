const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, '../public/logo/icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple projects this simplifies things, but use preload in prod for security ideally
            webSecurity: false // sometimes needed for local file fetching in mixed protocols
        }
    });

    mainWindow.maximize();

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173/admin/login');
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load the built index.html
        // We append the hash to navigate directly to admin login
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/admin/login' });
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
