# -*- coding: utf-8 -*-
import os
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
vits_dir = os.path.join(current_dir, "vits")
sys.path.append(vits_dir)

from flask import Flask, request, jsonify, send_file
import io
import glob
import numpy as np
import struct
import re
import json
import commons
import utils
import torch

from models import SynthesizerTrn
from text.symbols import symbols
from text import text_to_sequence
from text.cleaners import chinese_cleaners

model = None
hps = None

'''
错误代码直接print
code:错误信息
1：合成失败
2：模型未加载
'''

app = Flask(__name__)

def latest_checkpoint_path(dir_path, regex="G_*.pth"):
  f_list = glob.glob(os.path.join(dir_path, regex))
  f_list.sort(key=lambda f: int("".join(filter(str.isdigit, f))))
  x = f_list[-1]
  return x

cuda = torch.cuda.is_available()
    

def get_text(text, hps):
    if not model or not hps:
        print(2)
    text = text.replace("\n", "")
    text_norm = text_to_sequence(text, hps.data.text_cleaners)
    if hps.data.add_blank:
        text_norm = commons.intersperse(text_norm, 0)
    text_norm = torch.LongTensor(text_norm)
    return text_norm

def getCleaned(text):
    text = text.replace("\n", "-")
    text = chinese_cleaners(text)
    return text

def getAudio(text):
    if not model or not hps:
        print(2)
    stn_tst = get_text(text, hps)
    if cuda:
        with torch.no_grad():
            x_tst = stn_tst.cuda().unsqueeze(0)
            x_tst_lengths = torch.LongTensor([stn_tst.size(0)]).cuda()
            rawAudio = net_g.infer(x_tst, 
                                x_tst_lengths, 
                                noise_scale=.667, 
                                noise_scale_w=0.8, 
                                length_scale=1)[0][0,0].data.cpu().float().numpy()
    else:
        with torch.no_grad():
            x_tst = stn_tst.unsqueeze(0)
            x_tst_lengths = torch.LongTensor([stn_tst.size(0)])
            rawAudio = net_g.infer(x_tst, 
                                x_tst_lengths, 
                                noise_scale=.667, 
                                noise_scale_w=0.8, 
                                length_scale=1)[0][0,0].data.cpu().float().numpy()
    return rawAudio

def getWav(rawAudio,sample_rate,num_channels):
    audio_data = np.array(rawAudio * 32767, dtype=np.int16).tobytes()

    # 计算音频数据的字节数
    data_size = len(audio_data)

    # 计算其他参数
    sample_width = 2
    byte_rate = sample_rate * num_channels * sample_width
    block_align = num_channels * sample_width

    # 创建BytesIO对象
    with io.BytesIO() as wav_file:
        # 写入RIFF头
        wav_file.write(b'RIFF')
        wav_file.write(struct.pack('<i', data_size + 36))
        wav_file.write(b'WAVE')

        # 写入格式子块
        wav_file.write(b'fmt ')
        wav_file.write(struct.pack('<i', 16))
        wav_file.write(struct.pack('<h', 1))
        wav_file.write(struct.pack('<h', num_channels))
        wav_file.write(struct.pack('<i', sample_rate))
        wav_file.write(struct.pack('<i', byte_rate))
        wav_file.write(struct.pack('<h', block_align))
        wav_file.write(struct.pack('<h', sample_width * 8))

        # 写入数据子块
        wav_file.write(b'data')
        wav_file.write(struct.pack('<i', data_size))
        wav_file.write(audio_data)

        # 获取字节流
        wav_bytes = wav_file.getvalue()
    return wav_bytes

@app.route('/getCleaned')
def cleaned_text():
    text = request.args.get('text')
    cleaned_text = getCleaned(text)
    return jsonify(cleaned_text=cleaned_text)

@app.route('/getAudio')
def audio_data():
    text = request.args.get('text')
    audio_array = getAudio(text)
    audio_bytes = getWav(audio_array,22050,1)
    file_to_send = send_file(io.BytesIO(audio_bytes), mimetype='application/octet-stream')
    return file_to_send

@app.route('/getByFile')
def long_audio_data():
    filePath = request.args.get('text')
    with open(filePath, 'r',encoding='utf-8') as f:
        text = f.read()
    pattern = r'[,.?!……，。？！\n\t 「」]+'
    sentences = re.split(pattern, text)
    audio_list=[]
    for sentence in sentences:
        sentence_cleaned = getCleaned(sentence)
        sentence_f=""
        for word in sentence_cleaned:
            if word in symbols:
                sentence_f+=word
            else:
                print(word)
        audio_list.append(getAudio(sentence_f))
    rawAudio = np.concatenate(audio_list)
    audio_bytes = getWav(rawAudio,22050,1)
    return send_file(io.BytesIO(audio_bytes), mimetype='application/octet-stream')

@app.route('/reloadModel')
def reload_model():
    global hps,model,net_g
    filePath = request.args.get('text')
    hps = utils.get_hparams_from_file(f'./models/{filePath}/config.json')
    model = latest_checkpoint_path(f'./models/{filePath}/')
    if cuda:
        net_g = SynthesizerTrn(
            len(symbols),
            hps.data.filter_length // 2 + 1,
            hps.train.segment_size // hps.data.hop_length,
            **hps.model).cuda()
        _ = net_g.eval()
    else:
        net_g = SynthesizerTrn(
            len(symbols),
            hps.data.filter_length // 2 + 1,
            hps.train.segment_size // hps.data.hop_length,
            **hps.model)
        _ = net_g.eval()
    _ = utils.load_checkpoint(model, net_g, None)
    return jsonify(cleaned_text='reload')


if __name__ == '__main__':
    app.run(host='localhost', port=9000)