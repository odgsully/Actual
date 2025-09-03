#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');
const AudioPlayer = require('./audio-player');
const path = require('path');

class ClaudeAudioWrapper {
    constructor() {
        this.audioPlayer = new AudioPlayer(process.env.AUDIO_PATH || './agent-audio');
        this.waitingForInput = false;
        this.waitingTimers = [];
        this.lastActivity = Date.now();
        this.hasPlayedBegun = false;
    }

    detectEvent(line) {
        // Patterns to detect various Claude Code events
        const patterns = {
            taskBegun: [
                /I'll help/i,
                /Let me/i,
                /I'll start/i,
                /Working on/i,
                /I'm going to/i,
                /Starting/i,
                /I'll create/i,
                /I'll implement/i
            ],
            taskCompleted: [
                /completed successfully/i,
                /done/i,
                /finished/i,
                /successfully created/i,
                /successfully implemented/i,
                /task.{0,20}completed/i,
                /completed the/i
            ],
            needsInput: [
                /\?$/,
                /would you like/i,
                /please provide/i,
                /please specify/i,
                /what would you/i,
                /should I/i,
                /do you want/i,
                /would you prefer/i
            ]
        };

        // Check for task begun (only play once per session)
        if (!this.hasPlayedBegun) {
            for (const pattern of patterns.taskBegun) {
                if (pattern.test(line)) {
                    this.audioPlayer.playBegun();
                    this.hasPlayedBegun = true;
                    break;
                }
            }
        }

        // Check for task completed
        for (const pattern of patterns.taskCompleted) {
            if (pattern.test(line)) {
                this.audioPlayer.playTaskCompleted();
                this.hasPlayedBegun = false; // Reset for next task
                break;
            }
        }

        // Check for needs input
        for (const pattern of patterns.needsInput) {
            if (pattern.test(line)) {
                this.audioPlayer.playNeedsInput();
                this.startWaitingTimers();
                this.waitingForInput = true;
                break;
            }
        }
    }

    startWaitingTimers() {
        // Clear any existing timers
        this.clearWaitingTimers();

        // 2-minute timer
        this.waitingTimers.push(setTimeout(() => {
            if (this.waitingForInput) {
                this.audioPlayer.playWaitingInput();
            }
        }, 2 * 60 * 1000));

        // 5-minute timer
        this.waitingTimers.push(setTimeout(() => {
            if (this.waitingForInput) {
                this.audioPlayer.playWaitingInput();
            }
        }, 5 * 60 * 1000));
    }

    clearWaitingTimers() {
        this.waitingTimers.forEach(timer => clearTimeout(timer));
        this.waitingTimers = [];
    }

    handleUserInput() {
        this.waitingForInput = false;
        this.clearWaitingTimers();
        this.lastActivity = Date.now();
    }

    run() {
        // Get Claude Code command from arguments or use default
        const claudeCommand = process.argv[2] || 'claude';
        const claudeArgs = process.argv.slice(3);

        console.log(`Starting Claude Code with audio notifications...`);
        console.log(`Audio files should be in: ${this.audioPlayer.audioPath}`);

        // Spawn Claude Code process
        const claudeProcess = spawn(claudeCommand, claudeArgs, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });

        // Create readline interface for stdout
        const rlStdout = readline.createInterface({
            input: claudeProcess.stdout,
            crlfDelay: Infinity
        });

        // Monitor stdout
        rlStdout.on('line', (line) => {
            console.log(line);
            this.detectEvent(line);
        });

        // Create readline interface for stderr
        const rlStderr = readline.createInterface({
            input: claudeProcess.stderr,
            crlfDelay: Infinity
        });

        // Monitor stderr
        rlStderr.on('line', (line) => {
            console.error(line);
        });

        // Forward stdin to Claude process
        process.stdin.on('data', (data) => {
            this.handleUserInput();
            claudeProcess.stdin.write(data);
        });

        // Handle process exit
        claudeProcess.on('exit', (code) => {
            this.clearWaitingTimers();
            process.exit(code);
        });

        // Handle errors
        claudeProcess.on('error', (err) => {
            console.error('Failed to start Claude Code:', err);
            process.exit(1);
        });
    }
}

// Run the wrapper
if (require.main === module) {
    const wrapper = new ClaudeAudioWrapper();
    wrapper.run();
}

module.exports = ClaudeAudioWrapper;