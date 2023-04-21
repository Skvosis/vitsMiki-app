/*
TODO:
退出程序的时候把所有子进程正确杀死


*/



const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { Menu } = require('electron');
const psTree = require('ps-tree');

let mainWindow;
let terminalWindow;
let pythonProcess;
let pythonTrain = null;
let tensorboardProcess = null;


const createWindow = function () {
	const iconPath = process.platform === 'darwin' ? "icon/app512.icns" : "icon/app512.ico";

	mainWindow = new BrowserWindow({
		width: 1024,
		height: 768,
		title: "vits-Miki",
		icon: iconPath,
		resizable: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
		},
	});

	Menu.setApplicationMenu(null);
	mainWindow.loadFile('index.html');

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

const createTerminalWindow = function () {
	terminalWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
		}
	});
	Menu.setApplicationMenu(null);
	terminalWindow.loadFile('terminal.html');
}

const runApp = function () {

	if (!pythonProcess) {
		pythonProcess = spawn("python_env/Scripts/python.exe",
			['py/textProcessor.py', 9000],
			{ env: { PYTHONIOENCODING: 'UTF-8' } });
	}


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

	setTimeout(() => { createWindow(); }, 700);
	setTimeout(() => { terminalWindow.close(); }, 2000);

}

//tensorboard相关

const startTensorboard = function (logdir, sender) {
	if (tensorboardProcess) {
		return;
	}

	const pythonEnvPath = path.join(__dirname, './python_env');
	const pythonExecutable = process.platform === 'win32' ? 'python.exe' : 'python';
	const pythonPath = path.join(pythonEnvPath, 'Scripts', pythonExecutable);
	const tensorboardExecutable = 'win32' ? 'tensorboard.exe' : 'tensorboard';
	const tensorboardScriptPath = path.join(pythonEnvPath, 'Scripts', tensorboardExecutable);

	tensorboardProcess = spawn(pythonPath, [tensorboardScriptPath,
		'--logdir', logdir,
		'--reload_interval', '30']);

	tensorboardProcess.stderr.on('data', (data) => {
		const output = data.toString();
		console.log(`stderr: ${output}`);
		const urlMatch = output.match(/http:\/\/localhost:\d+/);
		console.log(urlMatch);
		if (urlMatch) {
			sender.send('tensorboard-url', urlMatch[0]);
		}
	});

	tensorboardProcess.stdout.on('data', (data) => {
		console.error(`stdout: ${data}`);
	});

	tensorboardProcess.on('close', (code) => {
		console.log(`TensorBoard process exited with code ${code}`);
	});
}

const stopTensorboard = function () {
	if (tensorboardProcess) {
		tensorboardProcess.kill();
	}
}

app.on('ready', () => {
	createTerminalWindow();
	const batName = process.platform === 'darwin' ? "create_env.sh" : "create_env.bat";

	const batPath = path.join(__dirname, 'scripts', batName);

	const batProcess = spawn(batPath);

	batProcess.stdout.on('data', (data) => {
		terminalWindow.webContents.send('terminal-data', data.toString());
	});

	batProcess.stderr.on('data', (data) => {
		terminalWindow.webContents.send('terminal-data', data.toString());
	});

	// 监听子进程的 exit 事件，在 .bat 文件执行完成后再创建窗口
	batProcess.on('close', () => {
		runApp();
	});
});

app.on('quit', () => {
	if (pythonProcess) {
		console.log('Killing pythonProcess before quitting the app');
		pythonProcess.kill();
	}
	if (pythonTrain) {
		console.log('Killing pythonTrain before quitting the app');
		pythonTrain.kill();
	}
	if (tensorboardProcess) {
		console.log('Killing tensorboardProcess before quitting the app');
		tensorboardProcess.kill();
	}
});

app.on('window-all-closed', () => {
	app.quit();
})

app.on('will-quit', () => {
	// 获取主进程PID
	const mainProcessPid = process.pid;

	// 使用ps-tree模块获取所有子进程的PID
	psTree(mainProcessPid, (err, children) => {
		if (err) throw err;

		// 遍历所有子进程，并向它们发送SIGTERM信号以终止它们
		for (const child of children) {
			console.log('Killing ${child.PID} process before quitting the app');
			process.kill(child.PID, 'SIGTERM');
		}
	});
});


//train.py部分

ipcMain.on('start-training', (event, configPath, modelNameValue) => {
	if (pythonTrain) {
		return;
	}
	const pythonExecutablePath = process.platform === 'win32' ? 'python.exe' : 'python';
	const pythonPath = path.join('python_env','Scripts',pythonExecutablePath)
	pythonTrain = spawn(pythonPath,
		["./vits/train.py", "-c", configPath, "-m", modelNameValue],
		{ env: { PYTHONIOENCODING: 'UTF-8' } });

	const logdir = `models/${modelNameValue}/`; //日志目录
	startTensorboard(logdir, event.sender);

	pythonTrain.stdout.on('data', (data) => {
		event.sender.send('python-train-data', data.toString());
	});

	pythonTrain.stderr.on('data', (data) => {
		event.sender.send('python-train-error', data.toString());
	});

	pythonTrain.on('close', (code) => {
		event.sender.send('python-train-exit', code);
		pythonTrain = null;
	});
});

ipcMain.on('stop-training', (event) => {
	if (pythonTrain) {
		pythonTrain.kill();
		pythonTrain = null;
	}
	event.sender.send('stop-train-feedback','pythonTrain is killed');
	stopTensorboard();
	event.sender.send('stop-train-feedback','tensorboard stopped');
});

