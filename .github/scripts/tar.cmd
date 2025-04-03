@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0\tar-wrapper.ps1" %* 
