#!/bin/bash

# 检查虚拟环境是否已经存在
if [ -d "./python_env" ]; then
  echo "Python virtual environment already exists."
  exit 0
fi

echo "Creating virtual environment"
# 创建虚拟环境
python -m venv python_env

# 激活虚拟环境
source ./python_env/Scripts/activate

echo "Installing requirements"
# 安装 requirements.txt 中的依赖包
pip install -r requirements.txt

echo "Building monotonic_align"
# 执行其他命令
cd vits
cd monotonic_align
mkdir monotonic_align
python setup.py build_ext --inplace

# 退出虚拟环境
deactivate

echo "Done."
