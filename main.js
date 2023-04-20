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
let pythonProcess;
let tensorboardProcess;


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

const runApp = function () {

	pythonProcess = spawn("python_env/Scripts/python.exe",
		['textProcessor.py', 9000],
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

	setTimeout(() => { createWindow(); }, 700);
}

app.on('ready', () => {
	const batName = process.platform === 'darwin' ? "create_env.sh" : "create_env.bat";
	const batPath = path.join(__dirname, 'scripts', batName);
	const batProcess = spawn(batPath);
	batProcess.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
	  });
	  
	  batProcess.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
	  });
	// 监听子进程的 exit 事件，在 .bat 文件执行完成后再创建窗口
	batProcess.on('close', () => {
		runApp();
	});
});

app.on('quit', () => {
	if (pythonProcess) {
		console.log('Killing TensorBoard process before quitting the app');
		pythonProcess.kill();
	}
	if (tensorboardProcess) {
		console.log('Killing TensorBoard process before quitting the app');
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


//tensorboard相关

ipcMain.on('start-tensorboard', (event, logdir) => {
	const pythonEnv = path.join(__dirname, './python_env/Scripts/activate');
	if (tensorboardProcess) {
		return;
	}
	tensorboardProcess = spawn('tensorboard',
		['--logdir', logdir,
			'--reload_interval', '30'], {
		env: { ...process.env, VIRTUAL_ENV: pythonEnv },
	});

	tensorboardProcess.stderr.on('data', (data) => {
		const output = data.toString();
		console.log(`stderr: ${output}`);
		const urlMatch = output.match(/http:\/\/localhost:\d+/);
		console.log(urlMatch);
		if (urlMatch) {
			event.sender.send('tensorboard-url', urlMatch[0]);
		}
	});

	tensorboardProcess.stdout.on('data', (data) => {
		console.error(`stdout: ${data}`);
	});

	tensorboardProcess.on('close', (code) => {
		console.log(`TensorBoard process exited with code ${code}`);
	});
});

ipcMain.on('stop-tensorboard', () => {
	if (tensorboardProcess) {
		tensorboardProcess.kill();
	}
});