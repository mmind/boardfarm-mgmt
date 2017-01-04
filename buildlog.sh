#!/bin/bash

echo "Build log"
pipe=buildlog.fifo

if [[ ! -p $pipe ]]; then
#	mkfifo $pipe
	touch $pipe
fi

while true
do
	tail -f $pipe
#    if read line <$pipe; then
#        echo $line
#    fi
done