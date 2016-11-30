#!/bin/bash

echo "/usr/bin/telnet localhost $1"
bash -c "while /bin/true; do /usr/bin/telnet localhost $1; sleep 2; done"
