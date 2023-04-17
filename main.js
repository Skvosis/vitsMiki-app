const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');
const { Menu } = require('electron');
const config = require('./configs/app.json');

function createWindow() {

	mainWindow = new BrowserWindow({
		width: config.width,
		height: config.height,
		minWidth: config.minWidth,
		minHeight: config.minHeight,
		title: config.title,
		icon: config.iconPath,
		resizable: config.resizable,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
		},
	});

	Menu.setApplicationMenu(null);
	mainWindow.loadFile('index.html');

	mainWindow.on('closed', () => {
		if (pythonProcess) {
			pythonProcess.kill();
		}
		mainWindow = null;
	});
}

app.on('ready', () => {

	pythonProcess = spawn(config.pythonPath,
		['textProcessor.py', config.port],
		{ env: { PYTHONIOENCODING: 'UTF-8' } });

	pythonProcess.stdout.on('data', (data) => {
		const output = data.toString().trim();
		const status = parseInt(output);

		if (!isNaN(status) && status >= 0 && status <= 20) {
			mainWindow.webContents.send('update-progress', status);
		}
		console.log(`Python stdout: ${data.toString('utf8')}`);
	});

	pythonProcess.stderr.on('data', (data) => {
		console.error(`textProcessor.py error: ${data.toString('utf8')}`);
	});

	pythonProcess.on('exit', (code) => {
		console.log(`textProcessor.py exited with code ${code}`);
	});

	setTimeout(() => { createWindow(); }, 500);
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow();
	}
});
