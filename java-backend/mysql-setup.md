# MySQL 安装和配置指南

## 1. 下载 MySQL

访问 MySQL 官方下载页面：
https://dev.mysql.com/downloads/mysql/

或使用国内镜像（更快）：
https://mirrors.huaweicloud.com/mysql/Downloads/MySQL-8.0/

推荐下载：**MySQL 8.0.x Windows ZIP Archive**

## 2. 安装步骤

### 2.1 解压文件
将下载的 ZIP 文件解压到：`C:\Program Files\MySQL\mysql-8.0.x`

### 2.2 创建配置文件
在 MySQL 安装目录下创建 `my.ini` 文件（见下方配置）

### 2.3 初始化数据库
```bash
# 以管理员身份运行 CMD
cd "C:\Program Files\MySQL\mysql-8.0.x\bin"
mysqld --initialize --console
```

**重要：记录输出中的临时密码！**
类似：`[Note] A temporary password is generated for root@localhost: xxxx`

### 2.4 安装 MySQL 服务
```bash
mysqld --install MySQL
net start MySQL
```

### 2.5 修改 root 密码
```bash
mysql -u root -p
# 输入临时密码

# 在 MySQL 命令行中执行：
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
FLUSH PRIVILEGES;
```

### 2.6 创建数据库
```sql
CREATE DATABASE aihub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. my.ini 配置文件内容

```ini
[mysqld]
# 设置 MySQL 安装目录
basedir=C:\\Program Files\\MySQL\\mysql-8.0.x
# 设置数据存储目录
datadir=C:\\Program Files\\MySQL\\mysql-8.0.x\\data
# 设置端口
port=3306
# 允许最大连接数
max_connections=200
# 允许连接失败的次数
max_connect_errors=10
# 服务端使用的字符集
character-set-server=utf8mb4
# 默认存储引擎
default-storage-engine=INNODB
# 默认认证插件
default_authentication_plugin=mysql_native_password

[mysql]
# 客户端使用的字符集
default-character-set=utf8mb4

[client]
# 客户端默认端口
port=3306
default-character-set=utf8mb4
```

## 4. 验证安装

```bash
# 检查服务状态
net start | findstr MySQL

# 连接测试
mysql -u root -p
# 输入密码：root

# 查看数据库
SHOW DATABASES;
```

## 5. 常用命令

```bash
# 启动服务
net start MySQL

# 停止服务
net stop MySQL

# 重启服务
net stop MySQL && net start MySQL
```

## 快速安装脚本

我已经为您准备了自动化安装脚本，请按以下步骤操作：

1. 下载 MySQL ZIP 文件
2. 解压到 `C:\Program Files\MySQL\mysql-8.0.x`
3. 以管理员身份运行 `mysql-install.bat`
