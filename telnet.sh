#!/bin/bash

bash -c "while /bin/true; do /usr/bin/telnet localhost $1; done"
