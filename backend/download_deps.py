#!/usr/bin/env python3
"""下载 H2 Database JAR（用于通过 JayDeBeApi 连接 H2）"""
import urllib.request
import os

H2_VERSION = "2.2.224"
JAR_URL = f"https://repo1.maven.org/maven2/com/h2database/h2/{H2_VERSION}/h2-{H2_VERSION}.jar"
DEST = os.path.join(os.path.dirname(__file__), "h2.jar")

if not os.path.exists(DEST):
    print(f"Downloading H2 {H2_VERSION}...")
    urllib.request.urlretrieve(JAR_URL, DEST)
    print(f"Saved to {DEST}")
else:
    print(f"H2 JAR already exists at {DEST}")
