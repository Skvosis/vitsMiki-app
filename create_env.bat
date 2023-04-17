@echo off

rem 检查虚拟环境是否已经存在
if exist .\python_env (
  echo Python virtual environment already exists.
  goto end
)

echo Creating virtual environment
rem 创建虚拟环境
python -m venv python_env

rem 激活虚拟环境
call .\python_env\Scripts\activate.bat

echo Installing requirements
rem 安装 requirements.txt 中的依赖包
pip install -r requirements.txt

echo Building monotonic_align
rem 执行其他命令
cd monotonic_align
mkdir monotonic_align
python setup.py build_ext --inplace

rem 退出虚拟环境
deactivate

:end
echo Done.