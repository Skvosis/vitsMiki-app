import os
import sys
import re
from pypinyin import lazy_pinyin, BOPOMOFO
import jieba
import cn2an
import logging


# List of (Latin alphabet, bopomofo) pairs:
_latin_to_bopomofo = [(re.compile('%s' % x[0]), x[1]) for x in [
    ('A', 'ㄟˉ'),
    ('B', 'ㄅㄧˋ'),
    ('C', 'ㄙㄧˉ'),
    ('D', 'ㄉㄧˋ'),
    ('E', 'ㄧˋ'),
    ('F', 'ㄝˊㄈㄨˋ'),
    ('G', 'ㄐㄧˋ'),
    ('H', 'ㄝˇㄑㄩˋ'),
    ('I', 'ㄞˋ'),
    ('J', 'ㄐㄟˋ'),
    ('K', 'ㄎㄟˋ'),
    ('L', 'ㄝˊㄛˋ'),
    ('M', 'ㄝˊㄇㄨˋ'),
    ('N', 'ㄣˉ'),
    ('O', 'ㄡˉ'),
    ('P', 'ㄆㄧˉ'),
    ('Q', 'ㄎㄧㄡˉ'),
    ('R', 'ㄚˋ'),
    ('S', 'ㄝˊㄙˋ'),
    ('T', 'ㄊㄧˋ'),
    ('U', 'ㄧㄡˉ'),
    ('V', 'ㄨㄧˉ'),
    ('W', 'ㄉㄚˋㄅㄨˋㄌㄧㄡˋ'),
    ('X', 'ㄝˉㄎㄨˋㄙˋ'),
    ('Y', 'ㄨㄞˋ'),
    ('Z', 'ㄗㄟˋ')
]]

def number_to_chinese(text):
    numbers = re.findall(r'\d+(?:\.?\d+)?', text)
    for number in numbers:
        text = text.replace(number, cn2an.an2cn(number), 1)
    return text


def chinese_to_bopomofo(text):
    text = text.replace('、', '，').replace('；', '，').replace('：', '，')
    words = jieba.lcut(text, cut_all=False)
    text = ''
    for word in words:
        bopomofos = lazy_pinyin(word, BOPOMOFO)
        if not re.search('[\u4e00-\u9fff]', word):
            text += word
            continue
        for i in range(len(bopomofos)):
            bopomofos[i] = re.sub(r'([\u3105-\u3129])$', r'\1ˉ', bopomofos[i])
        if text != '':
            text += ' '
        text += ''.join(bopomofos)
    return text


def latin_to_bopomofo(text):
    for regex, replacement in _latin_to_bopomofo:
        text = re.sub(regex, replacement, text)
    return text


def chinese_cleaners(text):
    text = number_to_chinese(text)
    text = chinese_to_bopomofo(text)
    text = latin_to_bopomofo(text)
    return text

def no_cleaners(text):
    return text