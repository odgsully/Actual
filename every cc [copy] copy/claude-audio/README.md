# Claude Code Audio Notifications

This system adds audio notifications to Claude Code sessions, playing sounds when specific events occur during your interaction with Claude.

## Audio Events

- **`begun.mp3`** - Plays when Claude starts working on a task
- **`needs-input.mp3`** - Plays when Claude is waiting for user input/response
- **`task-completed.mp3`** - Plays when Claude completes a task
- **`waiting-input.mp3`** - Plays if no response is given after 2 minutes, and again after 5 minutes

## Installation

1. Run the setup script:
   ```bash
   ./setup.sh
   ```

2. Add your audio files to the `agent-audio` directory (created at `~/agent-audio` by default):
   ```
   ~/agent-audio/
   ├── begun.mp3
   ├── needs-input.mp3
   ├── task-completed.mp3
   └── waiting-input.mp3
   ```

3. If `~/bin` is not in your PATH, add it to your shell profile:
   ```bash
   echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc  # or ~/.zshrc
   source ~/.bashrc  # or ~/.zshrc
   ```

## Usage

Replace `claude` with `claude-audio` in your commands:

```bash
# Instead of: claude
claude-audio

# Instead of: claude --help
claude-audio --help

# Instead of: claude --model opus-3-5-sonnet
claude-audio --model opus-3-5-sonnet
```

## Configuration

### Environment Variables

- `AUDIO_PATH` - Custom path to audio files directory (default: `./agent-audio`)
- `CLAUDE_AUDIO_ENABLED` - Set to `false` to disable audio notifications

Examples:
```bash
# Use custom audio directory
AUDIO_PATH=/path/to/my/sounds claude-audio

# Disable audio notifications
CLAUDE_AUDIO_ENABLED=false claude-audio
```

### Configuration File

Edit `~/.claude-audio/config.json` to customize:

- Audio file names
- Event detection patterns
- Timing intervals
- Enable/disable specific events

## Platform Support

### Audio Players
- **macOS**: Uses `afplay` (built-in)
- **Linux**: Uses `paplay` (PulseAudio) or `aplay` (ALSA) or `mpg123`
- **Windows**: Uses PowerShell with Media.SoundPlayer

### Installing Audio Players (Linux)

```bash
# For PulseAudio (Ubuntu/Debian)
sudo apt-get install pulseaudio-utils

# For ALSA (Ubuntu/Debian)
sudo apt-get install alsa-utils

# For mpg123 (cross-platform)
sudo apt-get install mpg123  # Ubuntu/Debian
brew install mpg123          # macOS
```

## Troubleshooting

### Audio Not Playing

1. **Check audio files exist:**
   ```bash
   ls ~/agent-audio/
   ```

2. **Test audio player manually:**
   ```bash
   # macOS
   afplay ~/agent-audio/begun.mp3
   
   # Linux (PulseAudio)
   paplay ~/agent-audio/begun.mp3
   
   # Linux (ALSA)
   aplay ~/agent-audio/begun.mp3
   ```

3. **Check environment variables:**
   ```bash
   echo $CLAUDE_AUDIO_ENABLED
   echo $AUDIO_PATH
   ```

### Event Detection Not Working

The system detects events by analyzing Claude's output text. If events aren't being detected properly, you can:

1. **Check the patterns in config.json** - Modify detection patterns to match Claude's responses better
2. **View debug output** - The wrapper shows all Claude output, so you can see what text is being analyzed

### Permission Issues

Make sure the wrapper script is executable:
```bash
chmod +x ~/.claude-audio/claude-audio-wrapper.js
```

## File Structure

```
claude-audio/
├── audio-player.js          # Cross-platform audio playback
├── claude-audio-wrapper.js  # Main wrapper script
├── config.json             # Configuration file
├── setup.sh               # Installation script
└── README.md              # This file
```

## How It Works

1. **Wrapper Process**: The `claude-audio-wrapper.js` starts Claude Code as a child process
2. **Output Monitoring**: Monitors Claude's stdout for specific text patterns
3. **Event Detection**: Matches patterns to trigger appropriate audio files
4. **Timer Management**: Tracks waiting periods and plays reminder sounds
5. **Audio Playback**: Uses platform-appropriate commands to play MP3 files

The wrapper is transparent - it forwards all input/output between you and Claude while adding audio notifications.