#!/bin/bash
DATE=`date '+%Y-%m-%d %H:%M:%S'`
echo "$DATE Start" >> execution_log.txt
cd src
/usr/bin/npm start
cd ..
git add *xml
git commit -m "Update feeds"
git push
ENDDATE=`date '+%Y-%m-%d %H:%M:%S'`
echo "$ENDDATE End" >> execution_log.txt
