@echo off
chcp 65001 >nul
echo ========================================
echo MySQL 密码重置脚本
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

set MYSQL_HOME=C:\Program Files\MySQL\mysql-8.0.36
set MYSQL_BIN=%MYSQL_HOME%\bin

echo [1/5] 停止 MySQL 服务...
net stop MySQL
if %errorLevel% neq 0 (
    echo [警告] 服务停止失败，可能未运行
)
echo [完成]

echo.
echo [2/5] 创建密码重置脚本...
(
echo ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
echo FLUSH PRIVILEGES;
echo CREATE DATABASE IF NOT EXISTS aihub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
) > "%MYSQL_HOME%\reset-password.sql"
echo [完成]

echo.
echo [3/5] 以跳过权限模式启动 MySQL...
start /B "" "%MYSQL_BIN%\mysqld" --skip-grant-tables --shared-memory
timeout /t 5 /nobreak >nul
echo [完成]

echo.
echo [4/5] 重置密码并创建数据库...
"%MYSQL_BIN%\mysql" -u root < "%MYSQL_HOME%\reset-password.sql"
if %errorLevel% equ 0 (
    echo [完成] 密码已重置为 'root'，数据库 'aihub' 已创建
) else (
    echo [错误] 重置失败
)

echo.
echo [5/5] 重启 MySQL 服务...
taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 2 /nobreak >nul
net start MySQL
if %errorLevel% equ 0 (
    echo [完成] MySQL 服务已重启
) else (
    echo [错误] 服务启动失败
)

echo.
echo ========================================
echo 重置完成！
echo ========================================
echo.
echo 新的 root 密码：root
echo 数据库 'aihub' 已创建
echo.
echo 验证连接：
"%MYSQL_BIN%\mysql" -u root -proot -e "SHOW DATABASES;"
echo.
pause
