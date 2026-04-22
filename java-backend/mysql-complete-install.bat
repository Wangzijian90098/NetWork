@echo off
chcp 65001 >nul
echo ========================================
echo MySQL 完整安装和配置脚本
echo ========================================
echo.

REM 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 请以管理员身份运行此脚本！
    pause
    exit /b 1
)

REM 询问 MySQL 安装路径
echo 请输入 MySQL 安装路径（例如：C:\Program Files\MySQL\mysql-8.0.36）
echo 如果已解压到该位置，直接按回车使用默认路径
set /p MYSQL_HOME=路径 [默认: C:\Program Files\MySQL\mysql-8.0.36]:
if "%MYSQL_HOME%"=="" set MYSQL_HOME=C:\Program Files\MySQL\mysql-8.0.36

set MYSQL_BIN=%MYSQL_HOME%\bin
set MYSQL_DATA=%MYSQL_HOME%\data

echo.
echo [1/8] 检查 MySQL 安装目录...
if not exist "%MYSQL_HOME%" (
    echo [错误] MySQL 目录不存在: %MYSQL_HOME%
    echo.
    echo 请先完成以下步骤：
    echo 1. 下载 MySQL: https://mirrors.huaweicloud.com/mysql/Downloads/MySQL-8.0/
    echo 2. 下载文件: mysql-8.0.36-winx64.zip
    echo 3. 解压到: %MYSQL_HOME%
    echo.
    pause
    exit /b 1
)
if not exist "%MYSQL_BIN%\mysqld.exe" (
    echo [错误] 找不到 mysqld.exe，请检查安装路径
    pause
    exit /b 1
)
echo [完成] MySQL 安装目录正确

echo.
echo [2/8] 停止并删除旧的 MySQL 服务...
sc query MySQL >nul 2>&1
if %errorLevel% equ 0 (
    net stop MySQL >nul 2>&1
    sc delete MySQL >nul 2>&1
    echo [完成] 已删除旧服务
) else (
    echo [完成] 没有旧服务
)

echo.
echo [3/8] 清理旧数据（如果存在）...
if exist "%MYSQL_DATA%" (
    echo 发现旧数据目录，是否删除？（Y/N）
    set /p CLEAN_DATA=
    if /i "%CLEAN_DATA%"=="Y" (
        rmdir /s /q "%MYSQL_DATA%"
        echo [完成] 已删除旧数据
    ) else (
        echo [跳过] 保留旧数据
    )
) else (
    echo [完成] 无旧数据
)

echo.
echo [4/8] 创建 my.ini 配置文件...
(
echo [mysqld]
echo basedir=%MYSQL_HOME:\=\\%
echo datadir=%MYSQL_DATA:\=\\%
echo port=3306
echo max_connections=200
echo character-set-server=utf8mb4
echo default-storage-engine=INNODB
echo default_authentication_plugin=mysql_native_password
echo.
echo [mysql]
echo default-character-set=utf8mb4
echo.
echo [client]
echo port=3306
echo default-character-set=utf8mb4
) > "%MYSQL_HOME%\my.ini"
echo [完成] 配置文件已创建

echo.
echo [5/8] 初始化 MySQL 数据库...
cd /d "%MYSQL_BIN%"
if not exist "%MYSQL_DATA%" (
    echo 正在初始化，请记录临时密码...
    echo ========================================
    mysqld --initialize --console
    echo ========================================
    if %errorLevel% neq 0 (
        echo [错误] 初始化失败
        pause
        exit /b 1
    )
    echo.
    echo 请记录上面显示的临时密码！
    echo 格式：[Note] A temporary password is generated for root@localhost: xxxxxx
    echo.
    pause
) else (
    echo [跳过] 数据目录已存在
)
echo [完成] 数据库初始化完成

echo.
echo [6/8] 安装 MySQL 服务...
mysqld --install MySQL
if %errorLevel% neq 0 (
    echo [错误] 服务安装失败
    pause
    exit /b 1
)
echo [完成] MySQL 服务已安装

echo.
echo [7/8] 启动 MySQL 服务...
net start MySQL
if %errorLevel% neq 0 (
    echo [错误] 服务启动失败
    echo 请检查错误日志: %MYSQL_DATA%\*.err
    pause
    exit /b 1
)
echo [完成] MySQL 服务已启动

echo.
echo [8/8] 验证服务状态...
sc query MySQL | findstr "RUNNING"
if %errorLevel% equ 0 (
    echo [完成] MySQL 服务运行正常
) else (
    echo [警告] 服务可能未正常运行
)

echo.
echo ========================================
echo 安装完成！
echo ========================================
echo.
echo 下一步：
echo 1. 使用临时密码登录并修改密码
echo    "%MYSQL_BIN%\mysql" -u root -p
echo.
echo 2. 在 MySQL 中执行：
echo    ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
echo    CREATE DATABASE aihub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo    FLUSH PRIVILEGES;
echo.
echo 或者运行快速配置脚本：
echo    mysql-quick-setup.bat
echo.
pause
