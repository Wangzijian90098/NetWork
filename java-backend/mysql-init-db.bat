@echo off
chcp 65001 >nul
echo ========================================
echo MySQL 数据库初始化脚本
echo ========================================
echo.

REM 设置 MySQL 路径
set MYSQL_HOME=C:\Program Files\MySQL\mysql-8.0.36
set MYSQL_BIN=%MYSQL_HOME%\bin

echo 请输入 MySQL root 用户的临时密码：
set /p TEMP_PASSWORD=

echo.
echo 正在初始化数据库...
echo.

REM 创建初始化 SQL 脚本
(
echo ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
echo FLUSH PRIVILEGES;
echo CREATE DATABASE IF NOT EXISTS aihub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo SHOW DATABASES;
echo SELECT 'Database setup completed!' AS Status;
) > "%TEMP%\mysql-init.sql"

REM 执行初始化
"%MYSQL_BIN%\mysql" -u root -p%TEMP_PASSWORD% < "%TEMP%\mysql-init.sql"

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo 初始化成功！
    echo ========================================
    echo.
    echo 新的 root 密码：root
    echo 数据库 'aihub' 已创建
    echo.
    echo 验证连接：
    "%MYSQL_BIN%\mysql" -u root -proot -e "SHOW DATABASES;"
) else (
    echo.
    echo [错误] 初始化失败，请检查临时密码是否正确
)

echo.
pause
