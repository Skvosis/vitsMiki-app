@echo off

rem 检查虚拟环境是否已经存在
if exist .\python_env (
  echo Python virtual environment already exists.
  goto end
)


echo Creating virtual environment
rem 创建虚拟环境
python -m venv python_env


echo activate python virtual environment
call .\python_env\Scripts\activate.bat

echo upgrade pip
python.exe -m pip install --upgrade pip
echo Done upgrading pip

echo Installing pytorch
pip3 install torch --index-url https://download.pytorch.org/whl/cu117
echo Done installing pytorch


echo Installing requirements
pip install -r requirements.txt
echo Done Installing requirements 

echo Building monotonic_align
cd vits
cd monotonic_align
mkdir monotonic_align
python setup.py build_ext --inplace
echo Done Building monotonic_align

echo Exit virtual environment
deactivate
echo Done exiting virtual environment

:end
echo All Done.