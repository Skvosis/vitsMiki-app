//2023.8.3 overhaul



const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { Menu } = require('electron');




const iconPath = process.platform === 'darwin' ? "icon/app512.icns" : "icon/app512.ico";

const pythonEnvPath = path.join(__dirname, './python_env');

const pythonExecutable = process.platform === 'win32' ? 'python.exe' : 'python';
const pythonPath = path.join(pythonEnvPath, 'Scripts', pythonExecutable);

const tensorboardExecutable = 'win32' ? 'tensorboard.exe' : 'tensorboard';
const tensorboardScriptPath = path.join(pythonEnvPath, 'Scripts', tensorboardExecutable);

const batName = process.platform === 'darwin' ? "create_env.sh" : "create_env.bat";
const batPath = path.join(__dirname, 'scripts', batName);





let mainWindow = null;
let terminalWindow = null;

let pythonProcess = null;
let pythonTrain = null;
let tensorboardProcess = null;
let batProcess = null;



const createMainWindow = function () {

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

	terminalWindow.on('closed', () => {
		terminalWindow = null;
	});
}




const runApp = function () {

	if (!pythonProcess) {
		pythonProcess = spawn(pythonPath,
			['py/textProcessor.py', 9000],
			{ env: { PYTHONIOENCODING: 'UTF-8' } });
	}


	pythonProcess.stdout.on('data', (data) => {
		const output = data.toString().trim();
		const status = parseInt(output);

		if (!isNaN(status) && status >= 0 && status <= 20) {
			mainWindow.webContents.send('update-progress', status);
		}
		logMessage(`Python stdout: ${data.toString('utf8')}`);
	});

	pythonProcess.stderr.on('data', (data) => {
		logMessage (`textProcessor.py error: ${data.toString('utf8')}`);
	});

	pythonProcess.on('exit', (code) => {
		logMessage (`textProcessor.py exited with code ${code}`);
	});

	setTimeout(() => { createMainWindow(); }, 700);
//	setTimeout(() => { terminalWindow.close(); }, 2000);

}

//tensorboard相关

const startTensorboard = function (logdir, sender) {

	if (tensorboardProcess) {
		return;
	}

	tensorboardProcess = spawn(pythonPath,
		[tensorboardScriptPath,
			'--logdir', logdir,
			'--reload_interval', '30']);

	tensorboardProcess.stderr.on('data', (data) => {
		const output = data.toString();
		logMessage (`stderr: ${output}`);
		const urlMatch = output.match(/http:\/\/localhost:\d+/);
		logMessage (urlMatch);
		if (urlMatch) {
			sender.send('tensorboard-url', urlMatch[0]);
		}
	});

	tensorboardProcess.stdout.on('data', (data) => {
		logMessage (`stdout: ${data}`);
	});

	tensorboardProcess.on('close', (code) => {
		logMessage (`TensorBoard process exited with code ${code}`);
	});
}

const stopTensorboard = function () {

	if (tensorboardProcess) {
		tensorboardProcess.kill();
	}
}

const startBat = function () {
	batProcess = spawn(batPath);

	batProcess.stdout.on('data', (data) => {
		terminalWindow.webContents.send('terminal-data', data.toString());
	});

	batProcess.stderr.on('data', (data) => {
		terminalWindow.webContents.send('terminal-data', data.toString());
	});

}


const getTime = function () {
	let now = new Date();

	let year = now.getFullYear();
	let month = now.getMonth();
	let date = now.getDate();
	let hours = now.getHours();
	let minutes = now.getMinutes();
	let seconds = now.getSeconds();
	month = month + 1;
	month = month.toString().padStart(2, "0");
	date = date.toString().padStart(2, "0");
	var defaultDate =`${ year }-${ month } -${ date } ${ hours }:${ minutes }:${ seconds }`;
	return defaultDate;
}
	
const logMessage = function(message){
	let time = getTime();
	let terminalData = `${time} : ${message}\n`
	if(terminalWindow){

		terminalWindow.webContents.send('terminal-data', terminalData);
	}
	console.log(message);
};	

app.on('ready', () => {

	createTerminalWindow();
	startBat();
	// 监听子进程的 exit 事件，在 .bat 文件执行完成后再创建窗口
	batProcess.on('close', () => {
		batProcess = null;
		runApp();
	});
});

app.on('quit', () => {

	if (pythonProcess) {
		logMessage ('Killing pythonProcess before quitting the app');
		pythonProcess.kill();
	}
	if (pythonTrain) {
		logMessage ('Killing pythonTrain before quitting the app');
		pythonTrain.kill();
	}
	if (tensorboardProcess) {
		logMessage ('Killing tensorboardProcess before quitting the app');
		tensorboardProcess.kill();
	}
});

app.on('window-all-closed', () => {
	app.quit();
})



//train.py部分

ipcMain.on('start-training', (event, configPath, modelNameValue) => {
	if (pythonTrain) {
		return;
	}
	const pythonExecutablePath = process.platform === 'win32' ? 'python.exe' : 'python';
	const pythonPath = path.join('python_env', 'Scripts', pythonExecutablePath)
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
	event.sender.send('stop-train-feedback', 'pythonTrain is killed');
	stopTensorboard();
	event.sender.send('stop-train-feedback', 'tensorboard stopped');
});

ipcMain.on('debug-meassage', (data) => {
	logMessage(data.toString());
});