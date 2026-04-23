@REM Maven Wrapper script for Windows

@echo off
setlocal

set MAVEN_PROJECTBASEDIR=%~dp0
set WRAPPER_JAR=maven-wrapper.jar
set WRAPPER_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar

@REM Check for maven-wrapper.jar
if not exist "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\%WRAPPER_JAR%" (
    echo Downloading Maven Wrapper JAR...
    powershell -Command "& { Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\%WRAPPER_JAR%' }"
)

@REM Execute Maven
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"
java %DEFAULT_JVM_OPTS% -classpath "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
