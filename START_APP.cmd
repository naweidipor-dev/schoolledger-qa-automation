@echo off
setlocal
cd /d "%~dp0"
set "SCHOOLLEDGER_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "SCHOOLLEDGER_NODE=C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
echo Starting SchoolLedger QA Lab at http://127.0.0.1:4173
start "" "http://127.0.0.1:4173"
"%SCHOOLLEDGER_NODE%" src\server.mjs
endlocal
