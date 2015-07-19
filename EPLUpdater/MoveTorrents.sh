#!/bin/sh
rename 's:(/[^/]*)/[^/]*$:$1$1.0.epub:' Torrents/*/*.epub
find Torrents/ -name "*.epub" -exec cp {} done/ \;
