#vits-miki 一站式训练合成的VITS
##介绍
本项目是一个基于electron编写的语音合成的GUI，模型来源是[MB-iSTFT-VITS](https://github.com/MasayaKawamura/MB-iSTFT-VITS/),界面部分参考了[vits-miki](https://huggingface.co/spaces/tumuyan/vits-miki)(作者是[秋之雪华](https://space.bilibili.com/80299))。
由于使用了[MB-iSTFT-VITS](https://github.com/MasayaKawamura/MB-iSTFT-VITS/)，训练速度达到了原版的__4__倍
这里可以制作数据集，训练，并且合成语音
![logo](/img/logo.png)
<br>
内置模型的声音素材来源于：[弥希Miki](https://space.bilibili.com/477317922)

##界面
![界面](/img/synthesize.png)
![界面](/img/train.png)
![界面](/img/dataPreprocess.png)
###鼠标放在右上角附近才可以看到页面切换的按钮
##使用方法
###下载打包好的版本（windows独享）
1. 在这里下载[第一个release](https://github.com/Skvosis/vitsMiki-app/releases/tag/v1.0.1)，解压，双击vits-miki.exe
2. 确保[python 3.7](https://www.python.org/downloads/release/python-379/)已经下载安装并且添加到系统`Path`
3. 等待安装环境，包和其他的预处理事项
4. 开始使用

__合成前需要先选择模型！内置的模型是我亲自训练，亲自部署的，但训练时长不是很够，数据集也一般，所以效果整体也就这样__
需要注意的是，第一次启动会很慢，所以如果出现界面点击没有生成音频，多等等（最多也就1分钟），实在不行就重新启动。当你成功合成一次后，之后就不会慢了

###使用源代码（可以获取更多信息，方便调试）
1. 下载代码到本地
2. 确保npm已经安装，python也已经安装
3. 在代码目录使用命令`npm install --save-dev electron`
4. `npm start`或者`electron .`

##杂项
+训练时应该输入模型名，然后点击确定，以此生成json。接着你可以在`/files/模型名/`里找到`模型名.json`。你需要把`train.txt.cleaned`,`test.txt.cleaned`和`wav`文件夹放入这里。`wav`文件夹里是所有的音频文件。具体的可能可以参阅[这里](https://www.bilibili.com/read/cv17826415?from=articleDetail)。
每一行的内容应该是
```
files/模型名/wav/音频名称|对应的文字（如果是.cleaned则是对应的符号）
```
你还可以在`py/dataPreprocess.py`中找到更多信息，甚至直接用那个脚本来制作你的数据集。未来数据集的制作也会整合进程序中（吧）
训练的时候，程序退出后可能没有完全退出，需要到任务管理器里杀死，建议常常检查一下，

##TODO
+加入数据处理页面
+正确退出程序
+美化，优化

##废弃版本README
# 内置iSTFT-VITS模型的语音合成和训练

本项目是一个基于electron编写的语音合成的GUI，模型来源是[MB-iSTFT-VITS](https://github.com/MasayaKawamura/MB-iSTFT-VITS/),界面部分参考了[
vits-miki](https://huggingface.co/spaces/tumuyan/vits-miki)(作者是[秋之雪华](https://space.bilibili.com/80299))。
<br>
声音来源于：[弥希Miki](https://space.bilibili.com/477317922)
![界面](/img/app.png)

## 使用方法

下载全部的代码，然后下载我的模型，所有模型均应放在`models/`文件夹中,这个文件夹下的每个子文件夹包含了一个模型，config文件也要放在这里

更新！现在也可以训练了

弥希Miki的模型下载：[GoogleDrive](https://drive.google.com/file/d/1JJ0D5h4n9laCNS_EaRqW-5W3YeRec1kv/view?usp=share_link)

本地需要安装npm和python，等我学会了怎么打包我再打包

建议使用python3.7版本，避免numpy等包的冲突。
[python 3.7](https://www.python.org/downloads/release/python-379/)

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

