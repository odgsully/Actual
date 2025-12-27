# GS-Site Print Scheduler

Automated print scheduling for Daily, Weekly, Monthly, and Quarterly reports.

## Schedule

| Report | Frequency | Time (AZ) | Cron |
|--------|-----------|-----------|------|
| Daily | Every day | 5:00 AM | `0 5 * * *` |
| Weekly | Sunday | 5:00 AM | `0 5 * * 0` |
| Monthly | 1st of month | 5:00 AM | `0 5 1 * *` |
| Quarterly | Jan/Apr/Jul/Oct 1st | 5:00 AM | `0 5 1 1,4,7,10 *` |

## Mac Studio Deployment

### Prerequisites

1. **GS Brother Printer** configured in CUPS as `GS_Brother_Printer`
2. **gs-site** running on port 3003 (or accessible URL)
3. SSH access to Mac Studio

### Step 1: SSH into Mac Studio

```bash
ssh garrettsullivan@mac-studio.local
# or
ssh garrettsullivan@<MAC_STUDIO_IP>
```

### Step 2: Create Directory Structure

```bash
mkdir -p ~/gs-site-scheduler/{scripts,logs,output/{daily,weekly,monthly,quarterly}}
```

### Step 3: Copy Files from MacBook Pro

From your MacBook Pro, run:

```bash
# Copy scripts
scp apps/gs-site/scheduler/scripts/*.sh garrettsullivan@mac-studio.local:~/gs-site-scheduler/scripts/

# Copy launchd plists
scp apps/gs-site/scheduler/launchd/*.plist garrettsullivan@mac-studio.local:~/Library/LaunchAgents/
```

Or from Mac Studio, pull from the repo:

```bash
cd ~/gs-site-scheduler/scripts
curl -O https://raw.githubusercontent.com/your-repo/main/apps/gs-site/scheduler/scripts/daily-print.sh
# ... etc
```

### Step 4: Make Scripts Executable

```bash
chmod +x ~/gs-site-scheduler/scripts/*.sh
```

### Step 5: Verify Printer Setup

```bash
# List printers
lpstat -p

# Ensure GS_Brother_Printer exists
lpstat -v GS_Brother_Printer

# If not, add it:
lpadmin -p GS_Brother_Printer -E -v "ipp://192.168.1.128:631/ipp/print" -m everywhere
```

### Step 6: Load launchd Jobs

```bash
# Load all print jobs
launchctl load ~/Library/LaunchAgents/com.gssite.print-daily.plist
launchctl load ~/Library/LaunchAgents/com.gssite.print-weekly.plist
launchctl load ~/Library/LaunchAgents/com.gssite.print-monthly.plist
launchctl load ~/Library/LaunchAgents/com.gssite.print-quarterly.plist
```

### Step 7: Verify Jobs are Loaded

```bash
launchctl list | grep gssite
```

Expected output:
```
-    0    com.gssite.print-daily
-    0    com.gssite.print-weekly
-    0    com.gssite.print-monthly
-    0    com.gssite.print-quarterly
```

### Step 8: Test Manually

```bash
# Test daily print
launchctl start com.gssite.print-daily

# Check logs
tail -f ~/gs-site-scheduler/logs/daily-$(date +%Y%m%d).log
```

## Troubleshooting

### Job Not Running

```bash
# Check if loaded
launchctl list | grep gssite

# Check for errors
cat ~/gs-site-scheduler/logs/*.stderr.log

# Reload job
launchctl unload ~/Library/LaunchAgents/com.gssite.print-daily.plist
launchctl load ~/Library/LaunchAgents/com.gssite.print-daily.plist
```

### Printer Not Found

```bash
# List available printers
lpstat -p -d

# Check printer connectivity
ping 192.168.1.128
nc -zv 192.168.1.128 631
```

### API Not Responding

Ensure gs-site is running on Mac Studio:

```bash
# Check if running
curl http://localhost:3003/api/health

# If not running, start it
cd ~/path/to/gs-site
npm run dev
```

## Uninstall

```bash
# Unload all jobs
launchctl unload ~/Library/LaunchAgents/com.gssite.print-*.plist

# Remove plists
rm ~/Library/LaunchAgents/com.gssite.print-*.plist

# Remove scheduler directory (optional)
rm -rf ~/gs-site-scheduler
```

## File Structure (on Mac Studio)

```
~/gs-site-scheduler/
├── scripts/
│   ├── daily-print.sh
│   ├── weekly-print.sh
│   ├── monthly-print.sh
│   └── quarterly-print.sh
├── logs/
│   ├── daily-YYYYMMDD.log
│   ├── weekly-YYYYMMDD.log
│   └── ...
└── output/
    ├── daily/
    │   └── daily-YYYY-MM-DD.pdf
    ├── weekly/
    │   └── weekly-YYYY-MM-DD.pdf
    ├── monthly/
    │   └── monthly-YYYY-MM.pdf
    └── quarterly/
        └── quarterly-YYYY-QX.pdf

~/Library/LaunchAgents/
├── com.gssite.print-daily.plist
├── com.gssite.print-weekly.plist
├── com.gssite.print-monthly.plist
└── com.gssite.print-quarterly.plist
```
