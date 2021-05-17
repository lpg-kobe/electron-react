#!/bin/bash
# author pika
# auto build between diff platform
# platform Linux Darwin MINGW64_NT-***
# set -x
packageFolder="`pwd`/release/win-unpacked"
targetFolder="`pwd`/nsis-build/FilesToInstall"
distFolder="`pwd`/app/dist"
result=$(uname -s)
mac='Darwin'
win='MING'
linux='Linux'

# clear dist folder of app before package
rm -rf $distFolder

if expr index $result $win > 0; then
echo 'build by win'

if test $1 = '--dev'; then
  yarn package-win-dev
else
  yarn package-win
fi

fi

if expr index $result $mac > 0; then
echo 'build by mac'

if test $1 = '--dev'; then
  yarn package-mac-dev
else
  yarn package-mac
fi

fi

if expr index $result $linux > 0; then
echo 'build by linux'

if test $1 = '--dev'; then
  yarn package-linux-dev
else
  yarn package-linux
fi

fi

echo "Cleaning up target folder of $targetFolder"
rm -rf $targetFolder/*

echo "Moving files of from package folder $packageFolder to target folder $targetFolder"
cp -rf $packageFolder/* $targetFolder

echo "Packaging application..."
if expr index $result $mac > 0; then
open "nsis-build/build-nim-nozip.bat"
else
cd "nsis-build/"
"./build-nim-nozip.bat"
fi

echo "Packaging application ended, find on folder of `root/nsis-build/Output"
