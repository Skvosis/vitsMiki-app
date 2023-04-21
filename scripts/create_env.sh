#!/bin/bash

# 检查虚拟环境是否已经存在
if [ -d "./python_env" ]; then
  echo "Python virtual environment already exists."
  exit 0
fi

echo "Creating virtual environment"
# 创建虚拟环境
python3 -m venv python_env

echo "Activate python virtual environment"
# 激活虚拟环境
source ./python_env/bin/activate

echo "Upgrade pip"
pip3 install --upgrade pip
echo "Done upgrading pip"

echo "Installing pytorch"
pip3 install torch
echo "Done installing pytorch"

echo "Installing requirements"
pip3 install -r requirements.txt
echo "Done installing requirements"

echo "Building monotonic_align"
cd vits/monotonic_align
mkdir -p build
python3 setup.py build_ext --inplace
cd ../..
echo "Done building monotonic_align"

echo "Deactivate virtual environment"
# 退出虚拟环境
deactivate
echo "Done exiting virtual environment"

echo "All Done."