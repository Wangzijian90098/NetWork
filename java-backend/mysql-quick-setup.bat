@echo off
chcp 65001 >nul
echo ========================================
echo MySQL 快速配置脚本
echo ========================================
echo.

set "MYSQL_BIN=C:\Program Files\MySQL\mysql-8.0.36\bin"

echo 请输入 MySQL root 用户的当前密码（临时密码）：
set /p CURRENT_PASSWORD=

echo.
echo 正在配置数据库...

REM 创建 SQL 脚本
(
echo ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
echo FLUSH PRIVILEGES;
echo CREATE DATABASE IF NOT EXISTS aihub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo USE aihub;
echo SELECT 'Database setup completed!' AS Status;
echo SHOW DATABASES;
) > "%TEMP%\mysql-setup.sql"

REM 执行配置
"%MYSQL_BIN%\mysql.exe" -u root "-p%CURRENT_PASSWORD%" < "%TEMP%\mysql-setup.sql"

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo 配置成功！
    echo ========================================
    echo.
    echo 新密码：root
    echo 数据库：aihub
    echo.
    echo 验证连接：
    "%MYSQL_BIN%\mysql.exe" -u root -proot -e "SHOW DATABASES;"
    echo.
    echo 现在可以启动 Spring Boot 应用了！
) else (
    echo.
    echo [错误] 配置失败
    echo 可能的原因：
    echo 1. 密码不正确
    echo 2. MySQL 服务未运行
    echo 3. MySQL 路径不正确
    echo.
    echo 请先运行 mysql-complete-install.bat 安装 MySQL
)

echo.
pause
