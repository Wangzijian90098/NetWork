#!/usr/bin/env python3
"""下载依赖文件：H2 Database JAR 和 ip2region IP 归属地数据库"""
import urllib.request
import os
import tempfile
import shutil
import tarfile

# ---- H2 Database JAR ----

H2_VERSION = "2.2.224"
JAR_URL = f"https://repo1.maven.org/maven2/com/h2database/h2/{H2_VERSION}/h2-{H2_VERSION}.jar"
H2_DEST = os.path.join(os.path.dirname(__file__), "h2.jar")

if not os.path.exists(H2_DEST):
    print(f"Downloading H2 {H2_VERSION}...")
    urllib.request.urlretrieve(JAR_URL, H2_DEST)
    print(f"Saved to {H2_DEST}")
else:
    print(f"H2 JAR already exists at {H2_DEST}")

# ---- ip2region IP 归属地数据库（npm 包版 v1 格式） ----

IP2REGION_URL = "https://registry.npmmirror.com/ip2region/-/ip2region-2.3.0.tgz"
IP2REGION_DEST = os.path.join(os.path.dirname(__file__), "data", "ip2region.xdb")

if not os.path.exists(IP2REGION_DEST):
    print(f"Downloading ip2region data file from npm mirror...")
    tgz = os.path.join(tempfile.gettempdir(), "ip2region_npm.tgz")
    urllib.request.urlretrieve(IP2REGION_URL, tgz)
    with tarfile.open(tgz, "r:gz") as tf:
        db_member = tf.getmember("package/data/ip2region.db")
        f = tf.extractfile(db_member)
        with open(IP2REGION_DEST, "wb") as out:
            shutil.copyfileobj(f, out)
    os.remove(tgz)
    size = os.path.getsize(IP2REGION_DEST)
    print(f"Saved ip2region.xdb ({size} bytes) to {IP2REGION_DEST}")
else:
    print(f"ip2region.xdb already exists at {IP2REGION_DEST}")
