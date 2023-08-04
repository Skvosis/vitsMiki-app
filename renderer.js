const { ipcRenderer, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');

const pages = document.querySelectorAll('.page');
const modelsDir = 'models';

//页面切换相关
function showPage(pageId) {
	// 隐藏所有页面
	pages.forEach((page) => {
		page.style.display = 'none';
	});

	// 显示指定的页面
	const targetPage = document.getElementById(pageId);
	if (targetPage) {
		targetPage.style.display = 'block';
	}
}


// 添加按钮点击事件以切换页面
synthesizeButton.addEventListener('click', () => {
	showPage('synthesizePage');
});

dataProcessButton.addEventListener('click', () => {
	showPage('dataProcessPage');
});

trainButton.addEventListener('click', () => {
	showPage('trainPage');
});

showPage('synthesizePage');

//元素
//合成
const textInput = document.getElementById('textInput');
const cleanedText = document.getElementById('cleanedText');
const getCleanedButton = document.getElementById('getCleanedButton');
const getAudioButton = document.getElementById('getAudioButton');
const audioElement = document.getElementById('outputAudio');
const fileInput = document.getElementById('fileInput');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const regetAudioButton = document.getElementById('regetAudioButton');
const modelSelect = document.getElementById('modelSelect');

//训练
const configName = document.getElementById('config-name');
const trainCount = document.getElementById('train-count');
const saveCheckpoint = document.getElementById('save-checkpoint');
const fileCount = document.getElementById('file-count');
const trainFiles = document.getElementById('train-files');
const valFiles = document.getElementById('val-files');
const cleaner = document.getElementById('cleaner');
const modelName = document.getElementById('model-name');
const modelSelectT = document.getElementById('modelSelectT');
const createJson = document.getElementById('createJson');
const DownloadJson = document.getElementById('DownloadJson');
const startTrain = document.getElementById('startTrain');
const stopTrain = document.getElementById('stopTrain');
const terminal = document.getElementById('terminal');
const output = document.getElementById('output');
const toTensorboard = document.getElementById('toTensorboard');
const tensorboardIframe = document.getElementById('tensorboardIframe');
const fullScreen = document.getElementById('fullScreen');

//预处理
const videoInput = document.getElementById('videoInput');
const audioInput1 = document.getElementById('audioInput1');
const audioInput2 = document.getElementById('audioInput2');
const videoToAudio = document.getElementById('videoToAudio');
const AudioToCaudio = document.getElementById('AudioToCaudio');
const caudioToText = document.getElementById('caudioToText');
const textOut = document.getElementById('textOut');
const Poutput = document.getElementById('Poutput');
const textDisplay = document.getElementById('textDisplay');
const audioPlayer = document.getElementById('audioPlayer');
const PsaveAsBtn = document.getElementById('PsaveAs');
const PsaveBtn = document.getElementById('Psave');
const convertToSymbolBtn = document.getElementById('convertToSymbol');
const PModelName = document.getElementById('PModelName');




//处理模型选择
const getModels = function (element) {
	fs.readdir(modelsDir, (err, files) => {
		if (err) {
			console.error(err);
			return;
		}
		files.forEach((file) => {
			const filePath = path.join(modelsDir, file);
			fs.stat(filePath, (err, stats) => {
				if (err) {
					console.error(err);
					return;
				}
				if (stats.isDirectory()) {
					const option = document.createElement('option');
					option.value = file;
					option.text = file;
					element.add(option);
				}
			});
		});
	});
}

const getModelsForSynthesizePage = function () {
	getModels(modelSelect);
	const emptyOption = document.createElement('option');
	emptyOption.value = '';
	emptyOption.text = '--做出你的选择吧！--';
	emptyOption.selected = true;
	modelSelect.add(emptyOption);
}

const getModelsForTrainPage = function () {
	getModels(modelSelectT);
	const emptyOption = document.createElement('option');
	emptyOption.value = '';
	emptyOption.text = '或者选择一个已有的模型';
	emptyOption.selected = true;
	modelSelectT.add(emptyOption);
}

getModelsForTrainPage()
getModelsForSynthesizePage()


//以下是合成区域
//切换状态显示
let currentStatus;
const toggleStatus = function (status) {
	switch (status) {
		case 'processing':
			currentStatus = status;
			progressBar.style.backgroundColor = '#FF7F50';
			progressText.innerHTML = "正在合成!!!";
			break;
		case 'finished':
			if (currentStatus === 'noModel') {
				break;
			}
			if (currentStatus === 'failed') {
				break;
			}
			currentStatus = status;
			progressBar.style.backgroundColor = '#99D75C';
			progressText.innerHTML = "成功!!!";
			break;
		case 'noModel':

			currentStatus = status;
			progressBar.style.backgroundColor = '#CC3E00';
			progressText.innerHTML = "模型没能正确加载！";
			break;
		case 'failed':

			currentStatus = status;
			progressBar.style.backgroundColor = '#CC3E00';
			progressText.innerHTML = "合成出了些问题，看看错误信息？";
			break;
		case 'default':

			currentStatus = status;
			progressBar.style.backgroundColor = '#BF90F0';
			progressText.innerHTML = "";
			break;
	}
}

ipcRenderer.on('update-progress', (event, status) => {
	switch (status) {
		case 1:
			toggleStatus('failed');
			break;
		case 2:
			toggleStatus('noModel');
			break;
	}
});

modelSelect.addEventListener('change', async () => {
	let selectedModel = modelSelect.value;
	if (selectedModel === '') {
		return; // 如果为空字符串，直接结束函数
	}
	const response = await fetch(`http://localhost:9000/reloadModel?text=${encodeURIComponent(selectedModel)}`);
	const data = await response.json();
	console.log(data);
});



//获取并播放合成后的音频
const getAndPlayAudio = async function (text) {
	toggleStatus('processing');
	const response = await fetch(`http://localhost:9000/getAudio?text=${encodeURIComponent(text)}`);
	const blob = await response.blob();
	const audioURL = URL.createObjectURL(blob);
	toggleStatus('finished');
	console.log(audioURL);
	audioElement.src = audioURL;
	audioElement.play();
}

getCleanedButton.addEventListener('click', async () => {
	toggleStatus('processing');
	const text = textInput.value;
	const response = await fetch(`http://localhost:9000/getCleaned?text=${encodeURIComponent(text)}`);
	const data = await response.json();
	console.log(data);
	cleanedText.value = data.cleaned_text;
	toggleStatus('finished');
	getAndPlayAudio(cleanedText.value);
});

getAudioButton.addEventListener('click', () => {
	getAndPlayAudio(cleanedText.value);
});

regetAudioButton.addEventListener('click', async () => {
	const filePath = fileInput.files[0].path;
	console.log(filePath);
	const response = await fetch(`http://localhost:9000/getByFile?text=${encodeURIComponent(filePath)}`);
	const blob = await response.blob();
	const audioURL = URL.createObjectURL(blob);
	console.log(audioURL);
	audioElement.src = audioURL;
	toggleStatus('finished');
	audioElement.play();
});

fileInput.addEventListener('change', async (event) => {
	const filePath = event.target.files[0].path;
	console.log(filePath);
	const response = await fetch(`http://localhost:9000/getByFile?text=${encodeURIComponent(filePath)}`);
	const blob = await response.blob();
	const audioURL = URL.createObjectURL(blob);
	console.log(audioURL);
	audioElement.src = audioURL;
	toggleStatus('finished');
	audioElement.play();
});


//以下是训练区域


let configNameValue = '';
let trainCountValue = trainCount.value;
let saveCheckpointValue = saveCheckpoint.value;
let fileCountValue = fileCount.value;
let trainFilesValue = '';
let valFilesValue = '';
let cleanerValue = cleaner.value;
let modelNameValue = '';

let configPath = ''


const getJsonFromSettings = function () {
	let jsonOut = {
		"train": {
			"log_interval": 100,
			"eval_interval": parseInt(saveCheckpointValue),
			"seed": 1234,
			"epochs": parseInt(trainCountValue),
			"learning_rate": 2e-4,
			"betas": [0.8, 0.99],
			"eps": 1e-9,
			"batch_size": parseInt(fileCountValue),
			"fp16_run": false,
			"lr_decay": 0.999875,
			"segment_size": 8192,
			"init_lr_ratio": 1,
			"warmup_epochs": 0,
			"c_mel": 45,
			"c_kl": 1.0,
			"fft_sizes": [384, 683, 171],
			"hop_sizes": [30, 60, 10],
			"win_lengths": [150, 300, 60],
			"window": "hann_window"
		},
		"data": {
			"training_files": trainFilesValue,
			"validation_files": valFilesValue,
			"text_cleaners": [cleanerValue],
			"max_wav_value": 32768.0,
			"sampling_rate": 22050,
			"filter_length": 1024,
			"hop_length": 256,
			"win_length": 1024,
			"n_mel_channels": 80,
			"mel_fmin": 0.0,
			"mel_fmax": null,
			"add_blank": true,
			"n_speakers": 0,
			"cleaned_text": true
		},
		"model": {
			"ms_istft_vits": false,
			"mb_istft_vits": false,
			"istft_vits": true,
			"subbands": false,
			"gen_istft_n_fft": 16,
			"gen_istft_hop_size": 4,
			"inter_channels": 192,
			"hidden_channels": 192,
			"filter_channels": 768,
			"n_heads": 2,
			"n_layers": 6,
			"kernel_size": 3,
			"p_dropout": 0.1,
			"resblock": "1",
			"resblock_kernel_sizes": [3, 7, 11],
			"resblock_dilation_sizes": [[1, 3, 5], [1, 3, 5], [1, 3, 5]],
			"upsample_rates": [8, 8],
			"upsample_initial_channel": 512,
			"upsample_kernel_sizes": [16, 16],
			"n_layers_q": 3,
			"use_spectral_norm": false,
			"use_sdp": false
		}
	}
	return JSON.stringify(jsonOut)
}

createJson.addEventListener('click', () => {
	let jsonString = getJsonFromSettings()
	let directoryPath = `files/${modelNameValue}`
	configPath = `files/${modelNameValue}/${configNameValue}`
	if (!fs.existsSync(directoryPath)) {
		fs.mkdirSync(directoryPath, { recursive: true });
	}
	fs.writeFile(configPath, jsonString, (err) => {
		if (err) throw err;
		console.log('JSON data is saved.');
	});
	output.textContent += `file ${configNameValue} saved successfully in ${directoryPath}/ \n`
	terminal.scrollTop = terminal.scrollHeight;
});

DownloadJson.addEventListener("click", function () {
	let jsonString = getJsonFromSettings()

	// 创建一个 Blob 对象，将 JSON 字符串作为内容
	let blob = new Blob([jsonString], { type: "application/json" });

	// 创建一个临时的 a 标签，用于触发下载操作
	let url = URL.createObjectURL(blob);
	let a = document.createElement("a");
	a.href = url;
	a.download = `${modelNameValue}.json`; // 指定下载的文件名

	// 模拟点击 a 标签以下载文件
	a.click();

	URL.revokeObjectURL(url);
	output.textContent += `file saved successfully\n`

	terminal.scrollTop = terminal.scrollHeight;
});

modelName.addEventListener('input', (event) => {
	modelNameValue = event.target.value;

	configNameValue = `${modelNameValue}.json`
	configName.value = configNameValue

	trainFilesValue = `files/${modelNameValue}/train.txt.cleaned`
	trainFiles.value = trainFilesValue
	valFilesValue = `files/${modelNameValue}/val.txt.cleaned`
	valFiles.value = valFilesValue
});

configName.addEventListener('input', (event) => {
	configNameValue = event.target.value;
});

trainCount.addEventListener('input', (event) => {
	trainCountValue = event.target.value;
});

saveCheckpoint.addEventListener('input', (event) => {
	saveCheckpointValue = event.target.value;
});

fileCount.addEventListener('input', (event) => {
	fileCountValue = event.target.value;
});

trainFiles.addEventListener('input', (event) => {
	trainFilesValue = event.target.value;
});

valFiles.addEventListener('input', (event) => {
	valFilesValue = event.target.value;
});

cleaner.addEventListener('input', (event) => {
	cleanerValue = event.target.value;
});

modelSelectT.addEventListener('change', async () => {
	let selectedModelT = modelSelectT.value;
	let obj
	if (selectedModelT === '') {
		return; // 如果为空字符串，直接结束函数
	}
	configPath = `./models/${selectedModelT}/config.json`
	fs.readFile(configPath, (err, data) => {
		if (err) {
			// 如果文件不存在，则输出错误信息
			output.textContent += `File not found: ${filePath}\n`;
		} else {
			try {
				// 将文件内容解析为JSON对象
				obj = JSON.parse(data);
				console.log(obj);

				configNameValue = 'config.json';
				trainCountValue = obj.train.epochs;
				saveCheckpointValue = obj.train.eval_interval;
				fileCountValue = obj.train.batch_size;
				trainFilesValue = obj.data.training_files;
				valFilesValue = obj.data.validation_files;
				cleanerValue = obj['data']['text_cleaners'][0];
				modelNameValue = selectedModelT;

				configName.value = configNameValue;
				trainCount.value = trainCountValue
				saveCheckpoint.value = saveCheckpointValue
				fileCount.value = fileCountValue
				trainFiles.value = trainFilesValue
				valFiles.value = valFilesValue
				cleaner.value = cleanerValue
				modelName.value = modelNameValue
				output.textContent += 'successfully read configuration\n'
			} catch (err) {
				// 如果文件内容无法解析为JSON，则输出错误信息
				output.textContent += `Invalid JSON format in file: ${filePath}\n`;
			}
		}
	});
});


startTrain.addEventListener('click', () => {

	ipcRenderer.send('start-training', configPath, modelNameValue);

	ipcRenderer.on('python-train-data', (_, data) => {
		output.textContent += data + '\n';
		terminal.scrollTop = terminal.scrollHeight;
	});

	ipcRenderer.on('python-train-error', (_, data) => {
		output.textContent += data + '\n';
		terminal.scrollTop = terminal.scrollHeight;
	});

	ipcRenderer.on('python-train-exit', (_, code) => {
		output.textContent += `python exited with code: ${code}\n`;
		terminal.scrollTop = terminal.scrollHeight;
		pythonTrain = null;
	});

	ipcRenderer.on('tensorboard-url', (_, url) => {
		console.log(url);
		tensorboardIframe.src = url;
		toTensorboard.style.visibility = "visible";
		fullScreen.style.visibility = "visible";
		toTensorboard.href = url;
	});
});

stopTrain.addEventListener('click', () => {
	ipcRenderer.send('stop-training');
	ipcRenderer.send('stop-tensorboard');
	ipcRenderer.on('stop-train-feedback', (_, data) => {
		console.log(data);
		output.textContent += data + '\n';
		terminal.scrollTop = terminal.scrollHeight;
	});
	toTensorboard.style.visibility = "hidden";
	fullScreen.style.visibility = "hidden";
	tensorboardIframe.src = '';
	toTensorboard.href = ' ';
});

fullScreen.addEventListener('click', () => {
	if(tensorboardIframe.src){
		tensorboardIframe.requestFullscreen();
	}
});

//以下是数据处理 
let PModelNameValue = ''

videoInput.addEventListener('change', handleVideoInput);
audioInput1.addEventListener('change', handleAudioInput1);
audioInput2.addEventListener('change', handleAudioInput2);
videoToAudio.addEventListener('click',handleVTA);
AudioToCaudio.addEventListener('click',handleATC);
caudioToText.addEventListener('click',handleCTT);
PsaveAsBtn.addEventListener('click', handleSaveAs);
PsaveBtn.addEventListener('click', handleSave);
convertToSymbolBtn.addEventListener('click', handleConvertToSymbol);
PModelName.addEventListener('input',(event)=>{
	PModelNameValue = event.target.value;
});


function handleVideoInput(event) {
	const filePath = event.target.files[0].path;
	
  }
  
  function handleAudioInput1(event) {
	// 处理音频文件输入1
  }
  
  function handleAudioInput2(event) {
	// 处理音频文件输入2
  }
  
  function handleVTA(event) {
  }
  function handleATC(event) {
  }
  function handleCTT(event) {
  }
  
  function handleSaveAs(event) {
  }
  
  function handleSave(event) {
  }
  
  function handleConvertToSymbol(event) {
  }