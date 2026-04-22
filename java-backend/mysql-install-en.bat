@echo off
echo ========================================
echo MySQL Installation Script
echo ========================================
echo.

REM Check admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please run as Administrator!
    pause
    exit /b 1
)

REM Set MySQL path
set "MYSQL_HOME=C:\Program Files\MySQL\mysql-8.0.36"
set "MYSQL_BIN=%MYSQL_HOME%\bin"
set "MYSQL_DATA=%MYSQL_HOME%\data"

echo [1/8] Checking MySQL directory...
if not exist "%MYSQL_HOME%" (
    echo [ERROR] MySQL directory not found: %MYSQL_HOME%
    echo.
    echo Please download MySQL from:
    echo https://mirrors.huaweicloud.com/mysql/Downloads/MySQL-8.0/
    echo File: mysql-8.0.36-winx64.zip
    echo Extract to: %MYSQL_HOME%
    echo.
    pause
    exit /b 1
)
if not exist "%MYSQL_BIN%\mysqld.exe" (
    echo [ERROR] mysqld.exe not found
    pause
    exit /b 1
)
echo [OK] MySQL directory found

echo.
echo [2/8] Removing old MySQL service...
sc query MySQL >nul 2>&1
if %errorLevel% equ 0 (
    net stop MySQL >nul 2>&1
    sc delete MySQL >nul 2>&1
    echo [OK] Old service removed
) else (
    echo [OK] No old service
)

echo.
echo [3/8] Cleaning old data...
if exist "%MYSQL_DATA%" (
    echo Old data directory found. Delete it? (Y/N)
    set /p CLEAN_DATA=
    if /i "%CLEAN_DATA%"=="Y" (
        rmdir /s /q "%MYSQL_DATA%"
        echo [OK] Old data removed
    ) else (
        echo [SKIP] Keeping old data
    )
) else (
    echo [OK] No old data
)

echo.
echo [4/8] Creating my.ini configuration...
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
echo [OK] Configuration created

echo.
echo [5/8] Initializing MySQL database...
cd /d "%MYSQL_BIN%"
if not exist "%MYSQL_DATA%" (
    echo Initializing... Please record the temporary password!
    echo ========================================
    mysqld --initialize --console
    echo ========================================
    if %errorLevel% neq 0 (
        echo [ERROR] Initialization failed
        pause
        exit /b 1
    )
    echo.
    echo IMPORTANT: Record the temporary password above!
    echo Format: [Note] A temporary password is generated for root@localhost: xxxxxx
    echo.
    pause
) else (
    echo [SKIP] Data directory exists
)
echo [OK] Database initialized

echo.
echo [6/8] Installing MySQL service...
mysqld --install MySQL
if %errorLevel% neq 0 (
    echo [ERROR] Service installation failed
    pause
    exit /b 1
)
echo [OK] MySQL service installed

echo.
echo [7/8] Starting MySQL service...
net start MySQL
if %errorLevel% neq 0 (
    echo [ERROR] Service start failed
    echo Check error log: %MYSQL_DATA%\*.err
    pause
    exit /b 1
)
echo [OK] MySQL service started

echo.
echo [8/8] Verifying service status...
sc query MySQL | findstr "RUNNING"
if %errorLevel% equ 0 (
    echo [OK] MySQL service is running
) else (
    echo [WARNING] Service may not be running properly
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Login with temporary password and change it:
echo    "%MYSQL_BIN%\mysql" -u root -p
echo.
echo 2. In MySQL, execute:
echo    ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
echo    CREATE DATABASE aihub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo    FLUSH PRIVILEGES;
echo.
echo Or run the quick setup script:
echo    mysql-quick-setup.bat
echo.
pause
