# 内置iSTFT-VITS模型的语音合成

本项目是一个基于electron编写的语音合成的GUI，模型来源是[MB-iSTFT-VITS](https://github.com/MasayaKawamura/MB-iSTFT-VITS/),界面部分参考了[
vits-miki](https://huggingface.co/spaces/tumuyan/vits-miki)(作者是[秋之雪华](https://space.bilibili.com/80299))。
<br>
声音来源于：[弥希Miki](https://space.bilibili.com/477317922)
![界面](/img/app.png)

## 使用方法

下载全部的代码，然后下载我的模型，所有模型均应放在`trained/`文件夹中

弥希Miki的模型下载：[GoogleDrive](https://drive.google.com/file/d/1JJ0D5h4n9laCNS_EaRqW-5W3YeRec1kv/view?usp=share_link)

本地需要安装npm和python，等我学会了怎么打包我再打包

你可以在[node.js](https://nodejs.org/zh-cn)下载和安装npm，接着在代码的目录运行：

```sh
npm install --save-dev
```

或者直接上网找教程，直接搜索如何安装electron。

接着输入

```sh
npm start
```

就可以运行了。
第一次运行启动会比较慢，因为需要安装python环境和必要的包



如果希望更改模型（比如自己训练的），可以在`configs/app.json`中更改自己的模型和模型的config，并把模型congfig也放在`configs/`中。程序会自动安装一个python的虚拟环境，如果你不想这么做，可以把`package.json`里的`start`改为`.electron`，然后将`configs/app.json`中的'pythonPath'改为自己的解释器位置，请确保`requirements.txt`中的包均已经安装。

<br>

另外，本程序代码使用MIT License，模型使用CC-BY-NC协议
