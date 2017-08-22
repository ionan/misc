#!/bin/bash
phantomjs job.js
git add *xml
git commit -m "Update feeds"
git push
