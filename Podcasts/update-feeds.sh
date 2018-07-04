#!/bin/bash
DATE=`date '+%Y-%m-%d %H:%M:%S'`
echo "$DATE Start" >> execution_log.txt
/usr/local/bin/phantomjs job.js
git add *xml
git commit -m "Update feeds"
git push
ENDDATE=`date '+%Y-%m-%d %H:%M:%S'`
echo "$ENDDATE End" >> execution_log.txt
