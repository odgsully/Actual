#!/bin/bash

# Claude Audio Notifications Setup Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$HOME/.claude-audio"

echo "🎵 Setting up Claude Code Audio Notifications"
echo "============================================="

# Create installation directory
echo "Creating installation directory at $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# Copy files
echo "Copying audio notification files..."
cp "$SCRIPT_DIR/audio-player.js" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/claude-audio-wrapper.js" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/config.json" "$INSTALL_DIR/"

# Make wrapper executable
chmod +x "$INSTALL_DIR/claude-audio-wrapper.js"

# Create symlink in user's bin directory
BIN_DIR="$HOME/bin"
if [ ! -d "$BIN_DIR" ]; then
    mkdir -p "$BIN_DIR"
    echo "Created $BIN_DIR directory"
fi

# Remove existing symlink if it exists
if [ -L "$BIN_DIR/claude-audio" ]; then
    rm "$BIN_DIR/claude-audio"
fi

# Create symlink
ln -s "$INSTALL_DIR/claude-audio-wrapper.js" "$BIN_DIR/claude-audio"
echo "Created symlink: $BIN_DIR/claude-audio -> $INSTALL_DIR/claude-audio-wrapper.js"

# Check if ~/bin is in PATH
if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
    echo ""
    echo "⚠️  Warning: $HOME/bin is not in your PATH"
    echo "   Add the following to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
    echo "   export PATH=\"\$HOME/bin:\$PATH\""
    echo ""
fi

# Create sample agent-audio directory structure
SAMPLE_AUDIO_DIR="$HOME/agent-audio"
if [ ! -d "$SAMPLE_AUDIO_DIR" ]; then
    echo "Creating sample audio directory at $SAMPLE_AUDIO_DIR"
    mkdir -p "$SAMPLE_AUDIO_DIR"
    
    echo "Creating placeholder audio files (you'll need to replace these with actual MP3s)..."
    for file in "begun.mp3" "needs-input.mp3" "task-completed.mp3" "waiting-input.mp3"; do
        if [ ! -f "$SAMPLE_AUDIO_DIR/$file" ]; then
            touch "$SAMPLE_AUDIO_DIR/$file"
            echo "Created placeholder: $SAMPLE_AUDIO_DIR/$file"
        fi
    done
    
    echo ""
    echo "📝 IMPORTANT: Replace the placeholder files in $SAMPLE_AUDIO_DIR with actual MP3 files:"
    echo "   - begun.mp3: Plays when Claude starts working"
    echo "   - needs-input.mp3: Plays when Claude needs user input"
    echo "   - task-completed.mp3: Plays when a task is completed"
    echo "   - waiting-input.mp3: Plays after 2 and 5 minutes of waiting"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Usage:"
echo "  claude-audio [claude-command] [arguments]"
echo ""
echo "Examples:"
echo "  claude-audio claude"
echo "  claude-audio claude --help"
echo "  claude-audio claude --model opus-3-5-sonnet"
echo ""
echo "Environment variables:"
echo "  AUDIO_PATH=./path/to/audio/files     # Custom audio directory"
echo "  CLAUDE_AUDIO_ENABLED=false          # Disable audio notifications"
echo ""
echo "Configuration file: $INSTALL_DIR/config.json"
echo ""

# Check for audio player availability
echo "Checking for audio players..."
if command -v afplay >/dev/null 2>&1; then
    echo "✅ afplay found (macOS)"
elif command -v paplay >/dev/null 2>&1; then
    echo "✅ paplay found (Linux/PulseAudio)"
elif command -v aplay >/dev/null 2>&1; then
    echo "✅ aplay found (Linux/ALSA)"
elif command -v mpg123 >/dev/null 2>&1; then
    echo "✅ mpg123 found"
else
    echo "⚠️  No audio player found. Please install one of:"
    echo "   - macOS: afplay (built-in)"
    echo "   - Linux: pulseaudio-utils (paplay) or alsa-utils (aplay)"
    echo "   - Cross-platform: mpg123"
fi

echo ""
echo "🎉 Setup complete! You can now use 'claude-audio' instead of 'claude' to get audio notifications."