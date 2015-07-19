#!/bin/sh
exec 2<&-
. ./EPLUpdater.properties
rename 's:(/[^/]*)/[^/]*$:$1$1.0.epub:' ${torrentsPath}*/*.epub
find ${torrentsPath} -name "*.epub" -exec cp {} ${donePath}/ \;
