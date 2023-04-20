""" from https://github.com/keithito/tacotron """

'''
Defines the set of symbols used in text input to the model.
'''

_pad        = '_'
_punctuation = '，。！？—-…“”《》.,!?,'
_letters = 'abcdefghijklmnopqrstuvwxyz'
_letters_zh = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦㄧㄨㄩˉˊˇˋ˙ '
# Export all symbols:
symbols = [_pad] + list(_punctuation) + list(_letters) + list(_letters_zh)

# Special symbol ids
SPACE_ID = symbols.index(" ")
