#!/bin/bash

IP=`echo $1 | cut -s -d "," -f 1`
PORT=`echo $1 | cut -s -d "," -f 2`

if [ "x$PORT" = "x" ]; then
	PORT=$1
	IP="localhost"
fi

echo "/usr/bin/telnet $IP $PORT"
bash -c "while /bin/true; do /usr/bin/telnet $IP $PORT; sleep 2; done"
