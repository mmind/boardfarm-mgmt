#!/bin/bash

if [ -f buildlog.lock ]; then
	echo "build already running"
	exit 1
fi

pwd=`pwd`
start=`date -R`

touch buildlog.lock

cd /home/devel/hstuebner/00_git-repos/linux
__maintainer-scripts/build_full.sh >$pwd/buildlog.fifo 2>&1
err=$?
end=`date -R`

cd $pwd
echo "$start;$end;$err" >>log/buildkernel.log

rm buildlog.lock
