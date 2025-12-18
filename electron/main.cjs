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

    const liveUrl = 'https://itsour-studio.vercel.app/admin/login';

    if (isDev) {
        mainWindow.loadURL(liveUrl);
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadURL(liveUrl);
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
