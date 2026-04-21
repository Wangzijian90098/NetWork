@echo off
chcp 65001 >nul
echo ========================================
echo MySQL 8.0 安装配置脚本
echo ========================================
echo.

REM 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 请以管理员身份运行此脚本！
    echo 右键点击此文件，选择"以管理员身份运行"
    pause
    exit /b 1
)

REM 设置 MySQL 安装路径（请根据实际情况修改）
set MYSQL_HOME=C:\Program Files\MySQL\mysql-8.0.36
set MYSQL_BIN=%MYSQL_HOME%\bin
set MYSQL_DATA=%MYSQL_HOME%\data

echo [1/7] 检查 MySQL 安装目录...
if not exist "%MYSQL_HOME%" (
    echo [错误] MySQL 安装目录不存在: %MYSQL_HOME%
    echo 请先下载并解压 MySQL 到该目录
    echo 下载地址: https://mirrors.huaweicloud.com/mysql/Downloads/MySQL-8.0/
    pause
    exit /b 1
)
echo [完成] 找到 MySQL 安装目录

echo.
echo [2/7] 添加 MySQL 到系统 PATH...
setx /M PATH "%PATH%;%MYSQL_BIN%" >nul 2>&1
if %errorLevel% equ 0 (
    echo [完成] PATH 环境变量已更新
) else (
    echo [警告] PATH 更新失败，请手动添加
)

echo.
echo [3/7] 创建 my.ini 配置文件...
(
echo [mysqld]
echo basedir=%MYSQL_HOME:\=\\%
echo datadir=%MYSQL_DATA:\=\\%
echo port=3306
echo max_connections=200
echo max_connect_errors=10
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
echo [4/7] 初始化 MySQL 数据库...
cd /d "%MYSQL_BIN%"
if exist "%MYSQL_DATA%" (
    echo [警告] 数据目录已存在，跳过初始化
) else (
    echo 正在初始化，请记录临时密码...
    echo ----------------------------------------
    mysqld --initialize --console
    echo ----------------------------------------
    if %errorLevel% neq 0 (
        echo [错误] 数据库初始化失败
        pause
        exit /b 1
    )
)
echo [完成] 数据库初始化完成

echo.
echo [5/7] 安装 MySQL 服务...
sc query MySQL >nul 2>&1
if %errorLevel% equ 0 (
    echo [警告] MySQL 服务已存在，先删除旧服务
    net stop MySQL >nul 2>&1
    mysqld --remove MySQL
)
mysqld --install MySQL
if %errorLevel% neq 0 (
    echo [错误] 服务安装失败
    pause
    exit /b 1
)
echo [完成] MySQL 服务已安装

echo.
echo [6/7] 启动 MySQL 服务...
net start MySQL
if %errorLevel% neq 0 (
    echo [错误] 服务启动失败
    pause
    exit /b 1
)
echo [完成] MySQL 服务已启动

echo.
echo [7/7] 创建数据库配置脚本...
(
echo -- 修改 root 密码为 'root'
echo ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
echo FLUSH PRIVILEGES;
echo.
echo -- 创建 aihub 数据库
echo CREATE DATABASE IF NOT EXISTS aihub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo.
echo -- 显示所有数据库
echo SHOW DATABASES;
echo.
echo SELECT 'Database setup completed!' AS Status;
) > "%MYSQL_HOME%\init-db.sql"
echo [完成] 数据库配置脚本已创建

echo.
echo ========================================
echo 安装完成！
echo ========================================
echo.
echo 重要提示：
echo 1. 请在上面的输出中找到临时密码
echo    格式类似：[Note] A temporary password is generated for root@localhost: xxxxxx
echo.
echo 2. 请关闭此窗口，重新打开一个新的命令提示符（以便 PATH 生效）
echo.
echo 3. 在新窗口中运行以下命令来完成数据库初始化：
echo.
echo    "%MYSQL_BIN%\mysql" -u root -p ^< "%MYSQL_HOME%\init-db.sql"
echo.
echo 4. 输入临时密码后，密码将被修改为 'root'，数据库 'aihub' 将自动创建
echo.
echo 5. 如果 mysql 命令仍然无法识别，请手动运行：
echo    "%MYSQL_BIN%\mysql" -u root -p
echo.
pause
