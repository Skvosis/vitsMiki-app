const { ipcRenderer } = require('electron');
const http = require('http');

const textInput = document.getElementById('textInput');
const cleanedText = document.getElementById('cleanedText');
const getCleanedButton = document.getElementById('getCleanedButton');
const getAudioButton = document.getElementById('getAudioButton');
const audioElement = document.getElementById('outputAudio');
const fileInput = document.getElementById('fileInput');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');


function toggleStatus(status) {

	switch (status) {
		case 'processing':
			progressBar.style.backgroundColor = '#FF7F50';
			progressText.innerHTML = "正在合成!!!"
			break;
		case 'finished':
			progressBar.style.backgroundColor = '#99D75C';
			progressText.innerHTML = "成功!!!";
			break;
		case 'failed':
			progressBar.style.backgroundColor = '#CC3E00';
			progressText.innerHTML = "合成出了些问题，看看错误信息？"
			break;
		case 'default':
			progressBar.style.backgroundColor = '#BF90F0';
			progressText.innerHTML = ""
			break;
	}
}

ipcRenderer.on('update-progress', (event, status) => {
	switch (status) {
		case 1:
			toggleStatus('failed');
			break;
	}
});

async function handleGetAudioClick() {
	const text = cleanedText.value;
	toggleStatus('processing');
	const response = await fetch(`http://localhost:9000/getAudio?text=${encodeURIComponent(text)}`);
	const blob = await response.blob();
	const audioURL = URL.createObjectURL(blob);
	toggleStatus('finished')
	console.log(audioURL)
	audioElement.src = audioURL;
	audioElement.play();
}


getCleanedButton.addEventListener('click', async () => {
	toggleStatus('processing')
	const text = textInput.value;
	const response = await fetch(`http://localhost:9000/getCleaned?text=${encodeURIComponent(text)}`);
	const data = await response.json();
	console.log(data);
	cleanedText.value = data.cleaned_text;
	toggleStatus('finished')
	handleGetAudioClick()
});

getAudioButton.addEventListener('click', handleGetAudioClick);

fileInput.addEventListener('change', async (event) => {
	toggleStatus('processing')
	const filePath = event.target.files[0].path;
	console.log(filePath)
	const response = await fetch(`http://localhost:9000/getByFile?text=${encodeURIComponent(filePath)}`);
	const blob = await response.blob();
	const audioURL = URL.createObjectURL(blob);
	console.log(audioURL)
	audioElement.src = audioURL;
	toggleStatus('finished')
	audioElement.play();
});
