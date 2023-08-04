@echo off

rem 检查虚拟环境是否已经存在
if exist .\python_preprocessing_env (
  echo Python virtual environment already exists.
  goto end
)


echo Creating virtual environment
rem 创建虚拟环境
python -m venv preprocessing


echo activate python virtual environment
call .\python_env\Scripts\activate.bat

echo upgrade pip
python.exe -m pip install --upgrade pip
echo Done upgrading pip


echo Installing requirements
pip install -r preprocessing_requirements.txt
echo Done Installing requirements 


echo Exit virtual environment
deactivate
echo Done exiting virtual environment

:end
echo All Done.