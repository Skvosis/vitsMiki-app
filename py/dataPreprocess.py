
#自己pip install一下，如果他说你需要安装包的话。
import pysrt
from pydub import AudioSegment
from pydub.silence import split_on_silence
import os
import whisper
import opencc
#这需要放在vits文件夹下执行
from cleaners import chinese_cleaners, no_cleaners
import re

#建议使用no_cleaners，生成可读的文件，然后自己把错误的地方随便去除一些
#然后使用python preprocess.py --text_index 1 --filelists ${训练集的位置}.txt ${测试集的位置}.txt 
#目标文件夹，生成的文件会放在这里
root_dst = 'E:/vits_cache/'
#来源的文件夹，你需要把视频放在这个文件夹下的${folder_name}文件夹里。比如下面这个案例就是要放在：
#`F:/VITS/data/origin/20221029/`里
#一共需要文件夹里有以下几个部分：subtitle.srt vocal.mp3
#他们可以由DD烤肉机2.0一键制作
#你可以在 https://github.com/zhimingshenjun/DD_KaoRou2找到这个项目
#bilibili的教程在这里 https://www.bilibili.com/video/BV1p5411b7o7/?spm_id_from=333.337.search-card.all.click
#生成出的文件会有一个text.txt,建议从中选择90%作为训练集，10%作为测试集，放在两个文件里，train.txt 和 test.txt。
#如果你用的是nocleaners，请执行上面的内容：{
#   python preprocess.py --text_index 1 --filelists ${训练集的位置}.txt ${测试集的位置}.txt 
# }
#我没做是因为反正这段没自动化，多一步手操也没啥不好的
#然后你需要启动主程序，然后去训练的那一页，然后创建一个json,就填填表就行，然后你去files/里找到你创建的文件夹（名字就是模型名），然后把这些file和wavs文件夹全扔进去
#理论上就可以开始训练了
root_from = 'F:/VITS/data/origin/'
folder_name = '20221029'
model_size = 'small'
cleanner = no_cleaners
print_information = True


def cut(min_threshold=1000):
    subtitle_dir = root_from+folder_name+'/subtitle.srt'
    audiopath = root_from+folder_name+'/vocal.mp3'
    audiotype = 'wav'
    dst_path = root_dst+folder_name+'/chunks/'
    
    subtitles = pysrt.open(subtitle_dir)
    audio = AudioSegment.from_file(audiopath, format='mp3')
    audio_mono = audio.set_channels(1).set_frame_rate(22050)

    if not os.path.exists(dst_path): os.makedirs(dst_path)

    count = 0

    for subtitle in subtitles:

        time_start = subtitle.start.milliseconds
        time_start += subtitle.start.seconds * 1000
        time_start += subtitle.start.minutes * 1000 * 60
        time_start += subtitle.start.hours * 1000 * 60 * 60

        time_end = subtitle.end.milliseconds
        time_end += subtitle.end.seconds * 1000
        time_end += subtitle.end.minutes * 1000 * 60
        time_end += subtitle.end.hours * 1000 * 60 * 60

        duration = time_end - time_start

        if duration > min_threshold:
            chunk = audio_mono[time_start: time_end]
            save_name = dst_path+'%04d.%s' % (count, audiotype)
            chunk.export(save_name, format=audiotype)
            count += 1
            if print_information:
                print('%04d %d' % (count, len(chunk)))

    return count


def to_text(count):
    chunks_path = root_dst+folder_name+'/chunks/'
    model = whisper.load_model(model_size)
    cc = opencc.OpenCC('t2s')
    simplified_text = []

    for i in range(count):
        audio_name = chunks_path+'%04d.%s' % (i, 'wav')
        transcribe = model.transcribe(audio_name)['text']
        convert = cc.convert(transcribe)
        simplified_text.append(convert)
        if print_information:
            print('toText %d: %s     %s'%(i,convert,transcribe))

    return simplified_text


def to_file(texts):
    texts_cleanned = cleanner(texts)
    file_path = root_dst+folder_name+'/text.txt'

    with open(file_path, 'w', encoding='utf-8') as f:
        for i in range(len(texts_cleanned)):
            string = '%04d.' % (i)+'wav|'+texts_cleanned[i]+'\n'
            f.write(string+'\n')
            if print_information:
                print('toFile: '+str(i)+' '+string)
    f.close()


if __name__ == '__main__':

    count = cut()
    texts = to_text(count)
    to_file(texts)

# from pydub import AudioSegment
# import sys
# import os

# from spleeter.separator import Separator
# from spleeter.audio.adapter import get_default_audio_adapter


# audioLoader = get_default_audio_adapter()
# separate = Separator('spleeter:2stems', stft_backend='tensorflow', multiprocess=multiThread)


# waveform, _ = audioLoader.load(audioPath, sample_rate=hz)  # 加载音频
# prediction = separate.separate(waveform)  # 核心部分 调用spleeter分离音频
# list_of_arguments = sys.argv

# filename = list_of_arguments[1]
# beginstep = list_of_arguments[2]

# #vta
# if beginstep <=2:
#     extension = os.path.splitext(filename)[-1]
#     audio = AudioSegment.from_file(filename, extension)
#     audio_mono = audio.set_channels(1).set_frame_rate(22050)
#     audio_mono.export("audio.wav", format="wav")

# if beginstep == 3:
    
# #ctt
# if beginstep<4:    
# # Load the video file
# video = AudioSegment.from_file("IN.mp4", "mp4")
# audio_mono = video.set_channels(1).set_frame_rate(22050)
# # Export the audio to a new file
# audio_mono.export("audio.wav", format="wav")

