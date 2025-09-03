#!/bin/bash
afplay ./agent-audio/needs-input.mp3 &>/dev/null &

# 2 minute reminder
(sleep 120 && afplay ./agent-audio/waiting-input.mp3 &>/dev/null &) &

# 5 minute reminder
(sleep 300 && afplay ./agent-audio/waiting-input.mp3 &>/dev/null &) &