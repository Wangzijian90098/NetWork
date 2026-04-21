#!/bin/bash

# 设置 Java 17 环境
export JAVA_HOME="/c/Users/wzj90/Java/jdk-17"
export PATH="$JAVA_HOME/bin:/c/Users/wzj90/Mvn/apache-maven-3.9.15/bin:$PATH"

# 编译项目
cd "$(dirname "$0")"
mvn clean package -DskipTests
