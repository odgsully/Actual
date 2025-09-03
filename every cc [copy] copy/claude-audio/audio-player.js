const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class AudioPlayer {
    constructor(audioPath = './agent-audio') {
        this.audioPath = audioPath;
        this.platform = os.platform();
        this.audioEnabled = process.env.CLAUDE_AUDIO_ENABLED !== 'false';
        this.validateAudioFiles();
    }

    validateAudioFiles() {
        const requiredFiles = ['begun.mp3', 'needs-input.mp3', 'task-completed.mp3', 'waiting-input.mp3'];
        const missingFiles = [];

        requiredFiles.forEach(file => {
            const fullPath = path.join(this.audioPath, file);
            if (!fs.existsSync(fullPath)) {
                missingFiles.push(file);
            }
        });

        if (missingFiles.length > 0) {
            console.warn(`Warning: Missing audio files in ${this.audioPath}:`, missingFiles);
        }
    }

    getPlayerCommand(filePath) {
        switch (this.platform) {
            case 'darwin': // macOS
                return `afplay "${filePath}"`;
            case 'linux':
                // Try multiple Linux audio players
                if (fs.existsSync('/usr/bin/paplay')) {
                    return `paplay "${filePath}"`;
                } else if (fs.existsSync('/usr/bin/aplay')) {
                    return `aplay "${filePath}"`;
                } else if (fs.existsSync('/usr/bin/mpg123')) {
                    return `mpg123 -q "${filePath}"`;
                }
                return null;
            case 'win32': // Windows
                return `powershell -c "(New-Object Media.SoundPlayer '${filePath}').PlaySync()"`;
            default:
                return null;
        }
    }

    play(audioFile) {
        if (!this.audioEnabled) {
            return Promise.resolve();
        }

        const filePath = path.join(this.audioPath, audioFile);
        
        if (!fs.existsSync(filePath)) {
            console.warn(`Audio file not found: ${filePath}`);
            return Promise.resolve();
        }

        const command = this.getPlayerCommand(filePath);
        
        if (!command) {
            console.warn(`No audio player found for platform: ${this.platform}`);
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            exec(command, (error) => {
                if (error) {
                    console.warn(`Failed to play audio: ${error.message}`);
                }
                resolve();
            });
        });
    }

    playBegun() {
        return this.play('begun.mp3');
    }

    playNeedsInput() {
        return this.play('needs-input.mp3');
    }

    playTaskCompleted() {
        return this.play('task-completed.mp3');
    }

    playWaitingInput() {
        return this.play('waiting-input.mp3');
    }
}

module.exports = AudioPlayer;