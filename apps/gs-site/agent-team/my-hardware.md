# My Hardware Integration

> Device registry and API integration documentation for app-controlled hardware

---

## Brother MFC-J6540DW (Inkjet All-in-One)

### Quick Specs
- **Type:** Inkjet All-in-One (Print/Copy/Scan/Fax)
- **Connectivity:** WiFi, Ethernet, USB
- **Network Protocols:** IPP, AirPrint, Mopria, eSCL (AirScan), WSD, Brother iPrint&Scan

---

## PRINTING

### Option 1: IPP (Internet Printing Protocol) - RECOMMENDED

**Feasibility: HIGH** - Native support, no API key needed

The MFC-J6540DW supports IPP natively. This is the same protocol behind AirPrint.

**Node.js Implementation:**
```bash
npm install ipp
```

```typescript
import ipp from 'ipp';

const printer = ipp.Printer('ipp://PRINTER_IP:631/ipp/print');

// Get printer status
printer.execute('Get-Printer-Attributes', null, (err, res) => {
  console.log(res);
});

// Print a document
const document = fs.readFileSync('document.pdf');
printer.execute('Print-Job', {
  'operation-attributes-tag': {
    'requesting-user-name': 'gs-site',
    'job-name': 'My Print Job',
    'document-format': 'application/pdf'
  },
  data: document
}, (err, res) => {
  console.log('Print job submitted:', res);
});
```

**Pros:**
- No API key required
- Works on local network
- Standard protocol (RFC 8011)
- Can query printer status, ink levels, job queue

**Cons:**
- Requires network access (not cloud-based)
- Must be on same network or use VPN/tunnel

**Resources:**
- [ipp npm package](https://github.com/williamkapke/ipp)
- [ipp-printer npm](https://www.npmjs.com/package/ipp-printer)

---

### Option 2: Brother Developer Program SDK

**Feasibility: MEDIUM** - Requires registration

Brother offers official SDKs through their Developer Program.

**Available SDKs:**
- Mobile SDK (iOS/Android)
- Desktop SDK (Windows/macOS)
- b-PAC SDK (Label printers - limited applicability)

**Registration:**
- [Brother Developer Program](https://developerprogram.brother-usa.com/)
- [SDK Downloads](https://developerprogram.brother-usa.com/sdk-download)

**Note:** The official SDKs are primarily for mobile/desktop apps, not web/Node.js. For a Next.js app, IPP is the better route.

---

### Option 3: REST API Wrapper (DIY)

**Feasibility: HIGH** - Build a local print server

Create a local microservice that wraps IPP calls in a REST API.

**Architecture:**
```
gs-site (Next.js) --> Local Print Server (Express) --> Brother Printer (IPP)
                          localhost:3100                   192.168.x.x:631
```

**Example Express Server:**
```typescript
// print-server.ts
import express from 'express';
import ipp from 'ipp';

const app = express();
const PRINTER_URL = 'ipp://192.168.1.XXX:631/ipp/print';

app.post('/api/print', async (req, res) => {
  const printer = ipp.Printer(PRINTER_URL);
  const { document, jobName } = req.body;

  printer.execute('Print-Job', {
    'operation-attributes-tag': {
      'requesting-user-name': 'gs-site',
      'job-name': jobName,
      'document-format': 'application/pdf'
    },
    data: Buffer.from(document, 'base64')
  }, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, jobId: result['job-id'] });
  });
});

app.get('/api/printer/status', (req, res) => {
  const printer = ipp.Printer(PRINTER_URL);
  printer.execute('Get-Printer-Attributes', null, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      state: result['printer-state'],
      stateReasons: result['printer-state-reasons'],
      inkLevels: result['marker-levels'] // if supported
    });
  });
});

app.listen(3100);
```

---

### Printing Capabilities Summary

| Feature | Available | Protocol |
|---------|-----------|----------|
| Print PDF | Yes | IPP |
| Print Images | Yes | IPP (JPEG, PNG) |
| Get Ink Levels | Yes | IPP (marker-levels) |
| Get Print Queue | Yes | IPP (Get-Jobs) |
| Cancel Job | Yes | IPP (Cancel-Job) |

---

## SCANNING

### Option 1: eSCL (AirScan) - RECOMMENDED

**Feasibility: HIGH** - Native driverless scanning

eSCL (Enterprise Scanner Communication Language) is the protocol behind Apple AirScan and Mopria scanning. It's HTTP/XML-based and works without drivers.

**How eSCL Works:**
```
Discovery: mDNS/Bonjour on _uscan._tcp or _uscans._tcp
Endpoint:  https://SCANNER_IP:443/eSCL/ (or http on port 80/8080)
Format:    XML requests/responses, returns JPEG/PDF/PNG
```

**eSCL Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/eSCL/ScannerCapabilities` | GET | Get scanner settings (resolutions, formats, sources) |
| `/eSCL/ScannerStatus` | GET | Check if idle, scanning, or error |
| `/eSCL/ScanJobs` | POST | Create a new scan job |
| `/eSCL/ScanJobs/{id}/NextDocument` | GET | Retrieve scanned image |
| `/eSCL/ScanJobs/{id}` | DELETE | Cancel scan job |

**Node.js Implementation:**
```typescript
// escl-scanner.ts
import axios from 'axios';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const SCANNER_URL = 'http://192.168.1.XXX:80/eSCL';

// Get scanner capabilities
async function getCapabilities() {
  const response = await axios.get(`${SCANNER_URL}/ScannerCapabilities`);
  const parser = new XMLParser();
  return parser.parse(response.data);
}

// Get scanner status
async function getStatus() {
  const response = await axios.get(`${SCANNER_URL}/ScannerStatus`);
  const parser = new XMLParser();
  return parser.parse(response.data);
}

// Start a scan job
async function startScan(options: {
  resolution?: number;
  colorMode?: 'BlackAndWhite1' | 'Grayscale8' | 'RGB24';
  format?: 'application/pdf' | 'image/jpeg' | 'image/png';
  source?: 'Flatbed' | 'Feeder';
}) {
  const scanSettings = `<?xml version="1.0" encoding="UTF-8"?>
<scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03"
                   xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm">
  <pwg:Version>2.0</pwg:Version>
  <scan:Intent>Document</scan:Intent>
  <pwg:InputSource>${options.source || 'Flatbed'}</pwg:InputSource>
  <scan:DocumentFormatExt>${options.format || 'application/pdf'}</scan:DocumentFormatExt>
  <scan:XResolution>${options.resolution || 300}</scan:XResolution>
  <scan:YResolution>${options.resolution || 300}</scan:YResolution>
  <scan:ColorMode>${options.colorMode || 'RGB24'}</scan:ColorMode>
</scan:ScanSettings>`;

  const response = await axios.post(`${SCANNER_URL}/ScanJobs`, scanSettings, {
    headers: { 'Content-Type': 'text/xml' }
  });

  // Job URL is in Location header
  return response.headers.location;
}

// Retrieve scanned document
async function getScanResult(jobUrl: string): Promise<Buffer> {
  const response = await axios.get(`${jobUrl}/NextDocument`, {
    responseType: 'arraybuffer'
  });
  return Buffer.from(response.data);
}
```

**Discover eSCL Scanners (macOS/Linux):**
```bash
# Find AirScan/eSCL devices
dns-sd -B _uscan._tcp
dns-sd -B _uscans._tcp

# Or use avahi (Linux)
avahi-browse -rt _uscan._tcp
```

**Resources:**
- [eSCL Protocol Reverse Engineering](https://gist.github.com/markosjal/79d03cc4f1fd287016906e7ff6f07136)
- [sane-airscan (eSCL/WSD backend)](https://github.com/alexpevzner/sane-airscan)
- [docscan4nodejs](https://github.com/yushulx/docscan4nodejs)
- [Go airscan package](https://github.com/stapelberg/airscan)

---

### Option 2: WSD (Web Services for Devices)

**Feasibility: MEDIUM** - Windows-native, more complex

WSD is Microsoft's SOAP-based protocol for network devices. More verbose than eSCL but widely supported.

**How WSD Works:**
```
Discovery: WS-Discovery multicast (UDP 3702)
Endpoint:  http://SCANNER_IP:5357/WSDScanner
Format:    SOAP/XML envelope
```

**WSD Scan Operations:**
| Operation | Purpose |
|-----------|---------|
| `GetScannerElements` | Get scanner capabilities |
| `ValidateScanTicket` | Validate scan settings before job |
| `CreateScanJob` | Start scanning |
| `RetrieveImage` | Get scanned image |
| `CancelJob` | Abort scan |
| `GetActiveJobs` | List running jobs |
| `GetJobHistory` | List completed jobs |

**Python Implementation (Recommended for WSD):**
```python
# wsd-scanner.py
# Uses WSD-python library
from wsd import WSDScanner

scanner = WSDScanner('192.168.1.XXX')

# Get capabilities
caps = scanner.get_scanner_elements()

# Create scan job
job = scanner.create_scan_job(
    input_source='Platen',  # or 'ADF'
    color_mode='RGB24',
    resolution=300,
    format='pdf'
)

# Retrieve scanned document
image_data = scanner.retrieve_image(job.id)
with open('scan.pdf', 'wb') as f:
    f.write(image_data)
```

**Node.js Approach:**
WSD is SOAP-heavy. Best to wrap a Python/Go service or use the Dynamsoft SDK:

```bash
npm install docscan4nodejs
```

```typescript
import { getDevices, scanDocument } from 'docscan4nodejs';

// Requires Dynamsoft service running on localhost:18625
const devices = await getDevices('http://127.0.0.1:18625', 'wsd');
const result = await scanDocument(devices[0], { format: 'pdf' });
```

**Resources:**
- [WSD-python (GitHub)](https://github.com/roncapat/WSD-python)
- [Microsoft WSD Documentation](https://learn.microsoft.com/en-us/windows-hardware/drivers/image/wia-with-web-services-for-devices)
- [SANE airscan (supports both WSD and eSCL)](https://github.com/alexpevzner/sane-airscan)

---

### Scanning Capabilities Summary

| Feature | eSCL | WSD | Notes |
|---------|------|-----|-------|
| Flatbed Scan | Yes | Yes | Both support |
| ADF (Auto Document Feeder) | Yes | Yes | Feeder/ADF source |
| Duplex Scan | Yes | Yes | If hardware supports |
| PDF Output | Yes | Yes | Native |
| JPEG Output | Yes | Yes | Native |
| Resolution Control | Yes | Yes | Up to scanner max |
| Color Modes | Yes | Yes | BW, Gray, Color |
| Browser Compatible | No* | No* | CORS blocks direct access |
| Node.js Native | Yes | Partial | eSCL is simpler |

*Requires local proxy service due to CORS restrictions

---

## REMOTE ACCESS (Off-Network Automation)

### The Problem

When you're not on the same network as your printer/scanner:
- Direct IP access fails (different subnet)
- IPP/eSCL/WSD all require local network connectivity
- No cloud API from Brother for this model

### Solution 1: Tailscale via Mac Studio (RECOMMENDED)

**What it does:** Creates a secure WireGuard mesh VPN between your devices. Your phone/laptop anywhere in the world can reach your home printer as if on the same LAN.

**Feasibility: HIGH** - Free tier, easy setup

**Bridge Device:** Mac Studio (always-on, same network as printer)

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                         TAILSCALE MESH                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Your Laptop/Phone]  ←──WireGuard──→  [Mac Studio]             │
│   (anywhere)                           (Tailscale subnet router)│
│       │                                    │                    │
│       │                                    ├──→ [Print Server]  │
│       │                                    │     localhost:3100 │
│       │                                    ▼                    │
│       └──────────────────────────→ [Brother Printer]            │
│                                     192.168.1.xxx:631           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Mac Studio Bridge Setup

#### Step 1: Install Tailscale

```bash
# Install via Homebrew
brew install tailscale

# Or download from https://tailscale.com/download/mac
```

#### Step 2: Start Tailscale & Login

```bash
# Start the Tailscale service
sudo tailscaled &

# Authenticate (opens browser)
tailscale login
```

Or use the macOS menu bar app after installation.

#### Step 3: Enable Subnet Routing

This allows remote devices to reach your entire home network (including the printer):

```bash
# Advertise your home network subnet
sudo tailscale up --advertise-routes=192.168.1.0/24

# If your network uses a different range (check with: ifconfig | grep inet)
# Common alternatives:
# sudo tailscale up --advertise-routes=192.168.0.0/24
# sudo tailscale up --advertise-routes=10.0.0.0/24
```

#### Step 4: Approve Routes in Admin Console

1. Go to https://login.tailscale.com/admin/machines
2. Find your Mac Studio in the list
3. Click the `...` menu → **Edit route settings**
4. Toggle ON the subnet route (e.g., `192.168.1.0/24`)
5. Save

#### Step 5: Enable IP Forwarding (Required for Subnet Routing)

```bash
# Enable IP forwarding
sudo sysctl -w net.inet.ip.forwarding=1

# Make it persistent across reboots
echo 'net.inet.ip.forwarding=1' | sudo tee -a /etc/sysctl.conf
```

#### Step 6: Install Tailscale on Remote Devices

- **iPhone/iPad:** App Store → Tailscale
- **MacBook:** `brew install tailscale` or download app
- **Windows:** https://tailscale.com/download/windows

#### Step 7: Test Remote Access

From your remote device (with Tailscale connected):

```bash
# Ping the printer
ping 192.168.1.XXX

# Test IPP endpoint
curl -I http://192.168.1.XXX:631/ipp/print
```

#### Step 8: (Optional) Run Print Server on Mac Studio

For a REST API wrapper, run this on the Mac Studio:

```bash
# Create project directory
mkdir -p ~/print-server && cd ~/print-server

# Initialize and install dependencies
npm init -y
npm install express ipp

# Create server file (see REST API Wrapper section above)
# Then run:
node print-server.js

# Or use PM2 for auto-restart:
npm install -g pm2
pm2 start print-server.js --name "print-server"
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

Now accessible from anywhere via Tailscale at:
- Direct printer: `ipp://192.168.1.XXX:631/ipp/print`
- REST API: `http://mac-studio.tail1234.ts.net:3100/api/print`

---

### MagicDNS Bonus

Tailscale assigns DNS names like `mac-studio.tail1234.ts.net` - use these instead of IPs for stability.

Enable in Tailscale Admin → DNS → Enable MagicDNS.

---

### Verify Mac Studio is Always-On

Ensure the Mac Studio doesn't sleep:

```bash
# Check current settings
pmset -g

# Prevent sleep (run once)
sudo pmset -a sleep 0
sudo pmset -a disksleep 0
sudo pmset -a displaysleep 0  # Optional: keep display off but machine awake

# Or via System Settings → Energy → Prevent automatic sleeping
```

---

### Alternative Bridge Devices

If Mac Studio isn't available:

| Device | Setup Effort | Power | Notes |
|--------|--------------|-------|-------|
| **Mac Studio** | Easy | ~50W idle | Already running, best option |
| **Raspberry Pi 4/5** | Medium | ~5W | Cheap dedicated bridge |
| **Pi Zero 2 W** | Medium | ~2W | Minimal, WiFi only |
| **Synology NAS** | Easy | Varies | Has Tailscale package |
| **Old MacBook** | Easy | ~15W | Disable sleep on lid close |

**Resources:**
- [Tailscale Subnet Routers](https://tailscale.com/kb/1019/subnets)
- [Tailscale for 3D Printers Guide](https://jointcraft.app/guides/remote-access-with-tailscale/)

---

### Solution 2: Cloudflare Tunnel

**What it does:** Exposes your local print server to the internet via Cloudflare's edge network. Good if you need public webhook access (e.g., from a cloud function).

**Feasibility: HIGH** - Free tier, requires Cloudflare account

**Architecture:**
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [Cloud Function/App]                                            │
│         │                                                        │
│         ▼                                                        │
│  https://print.yourdomain.com  ──→ [Cloudflare Edge]             │
│                                           │                      │
│                                           ▼                      │
│                              [cloudflared tunnel]                │
│                              (runs on home server)               │
│                                           │                      │
│                                           ▼                      │
│                               [Local Print Server]               │
│                                  localhost:3100                  │
│                                           │                      │
│                                           ▼                      │
│                               [Brother Printer IPP]              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Setup Steps:**

1. **Install cloudflared:**
   ```bash
   # macOS
   brew install cloudflared

   # Login
   cloudflared tunnel login
   ```

2. **Create tunnel:**
   ```bash
   cloudflared tunnel create print-server
   ```

3. **Configure tunnel** (`~/.cloudflared/config.yml`):
   ```yaml
   tunnel: <TUNNEL_ID>
   credentials-file: /path/to/credentials.json

   ingress:
     - hostname: print.yourdomain.com
       service: http://localhost:3100
     - service: http_status:404
   ```

4. **Add DNS record:**
   ```bash
   cloudflared tunnel route dns print-server print.yourdomain.com
   ```

5. **Run tunnel:**
   ```bash
   cloudflared tunnel run print-server

   # Or as a service
   sudo cloudflared service install
   ```

6. **Call from anywhere:**
   ```typescript
   // From any cloud function or remote app
   await fetch('https://print.yourdomain.com/api/print', {
     method: 'POST',
     body: JSON.stringify({ document: base64PDF, jobName: 'Remote Print' })
   });
   ```

**Security Consideration:**
Cloudflare decrypts traffic at their edge. For sensitive documents, add authentication to your print server.

**Resources:**
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Expose Local Services Guide](https://sascha.sh/posts/expose-local-services-to-the-internet-with-tailscale-or-cloudflare-part-2/)

---

### Solution 3: Tailscale Funnel (Public Access)

**What it does:** Like Cloudflare Tunnel but native to Tailscale. Exposes a local port to the public internet via `https://yourdevice.ts.net`.

**Use case:** When you need public webhook access but already use Tailscale.

```bash
# Expose local print server publicly
tailscale funnel 3100
```

Your print server is now at `https://yourdevice.tail1234.ts.net/`

---

### Comparison: Tailscale vs Cloudflare Tunnel

| Feature | Tailscale | Cloudflare Tunnel |
|---------|-----------|-------------------|
| **Best for** | Private device-to-device | Public API endpoints |
| **Setup** | Easier | Moderate |
| **Cost** | Free (100 devices) | Free |
| **Encryption** | End-to-end (WireGuard) | Edge termination |
| **Custom Domain** | Yes (Funnel) | Yes |
| **Speed** | Faster (direct mesh) | Slight latency (edge routing) |
| **Requires Client** | Yes (Tailscale app) | No |
| **Auth Built-in** | Yes (Tailscale ACLs) | Requires Cloudflare Access |

**Recommendation:**
- Use **Tailscale** if you control all endpoints (your laptop, your phone, your servers)
- Use **Cloudflare Tunnel** if you need third-party services to call your print server (webhooks, n8n, Zapier)

---

## AUTOMATION EXAMPLES

### Example 1: Print on Form Submission (gs-site)

```typescript
// apps/gs-site/app/api/hardware/print/route.ts
import { NextRequest, NextResponse } from 'next/server';

const PRINT_SERVER = process.env.PRINT_SERVER_URL || 'http://localhost:3100';

export async function POST(req: NextRequest) {
  const { document, jobName, copies } = await req.json();

  const response = await fetch(`${PRINT_SERVER}/api/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document, jobName, copies })
  });

  return NextResponse.json(await response.json());
}
```

### Example 2: Scheduled Scan (Cron)

```typescript
// Vercel cron or local scheduler
// Scans ADF every morning and uploads to Supabase Storage

import { scanWithESCL } from '@/lib/hardware/scanner';
import { supabase } from '@/lib/supabase/client';

export async function dailyScan() {
  const scanResult = await scanWithESCL({
    source: 'Feeder',
    format: 'application/pdf',
    resolution: 200
  });

  const fileName = `scans/${new Date().toISOString().split('T')[0]}.pdf`;

  await supabase.storage
    .from('documents')
    .upload(fileName, scanResult, { contentType: 'application/pdf' });
}
```

### Example 3: n8n Workflow Integration

```
Trigger: New email with attachment
   ↓
HTTP Request: POST https://print.yourdomain.com/api/print
   Body: { document: base64(attachment), jobName: "Email Print" }
   ↓
Notification: Slack message "Document printed"
```

---

## Full Protocol Reference

| Protocol | Port | Purpose | Node.js Support |
|----------|------|---------|-----------------|
| IPP | 631 | Printing | `ipp` npm |
| eSCL | 80/443 | Scanning (AirScan) | Custom HTTP/XML |
| WSD | 5357 | Scanning (Windows) | Python wrapper recommended |
| SNMP | 161 | Status/Ink levels | `net-snmp` npm |
| mDNS | 5353 | Device discovery | `bonjour-service` npm |

---

## Sources

### Printing
- [Brother Developer Program](https://developerprogram.brother-usa.com/)
- [Brother SDK Downloads](https://developerprogram.brother-usa.com/sdk-download)
- [MFC-J6540DW Downloads](https://support.brother.com/g/b/downloadlist.aspx?c=us&lang=en&prod=mfcj6540dw_us_eu_as&os=10012)
- [ipp npm package (GitHub)](https://github.com/williamkapke/ipp)
- [BrotherPrintServer REST API (GitHub)](https://github.com/DAmesberger/BrotherPrintServer)

### Scanning
- [eSCL Protocol Reverse Engineering](https://gist.github.com/markosjal/79d03cc4f1fd287016906e7ff6f07136)
- [sane-airscan (eSCL + WSD)](https://github.com/alexpevzner/sane-airscan)
- [docscan4nodejs](https://github.com/yushulx/docscan4nodejs)
- [Go airscan package](https://github.com/stapelberg/airscan)
- [WSD-python](https://github.com/roncapat/WSD-python)
- [Microsoft WSD Docs](https://learn.microsoft.com/en-us/windows-hardware/drivers/image/wia-with-web-services-for-devices)
- [Debian eSCL Wiki](https://wiki.debian.org/eSCL)

### Remote Access
- [Tailscale Subnet Routers](https://tailscale.com/kb/1019/subnets)
- [Tailscale Funnel](https://tailscale.com/kb/1223/funnel)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Tunnel Comparison (Twilio)](https://www.twilio.com/en-us/blog/expose-localhost-to-internet-with-tunnel)
- [Expose Local Services Guide](https://sascha.sh/posts/expose-local-services-to-the-internet-with-tailscale-or-cloudflare-part-2/)

---

## Toyota Tundra 2024 Platinum

### Quick Specs
- **Type:** Vehicle
- **Connectivity:** Toyota Connected Services (cellular)
- **App:** Toyota App (iOS/Android)

---

### Integration Options

#### Option 1: Smartcar API (RECOMMENDED)

**Feasibility: HIGH** - Third-party REST API for vehicles

Smartcar provides a developer-friendly API that works with Toyota vehicles, abstracting manufacturer systems into a clean REST interface.

**Capabilities via Smartcar:**
| Feature | Available |
|---------|-----------|
| Lock/Unlock | Yes |
| Vehicle Location | Yes |
| Odometer | Yes |
| Fuel Level | Yes |
| VIN Info | Yes |
| Remote Start | Limited* |

*Remote start depends on Toyota's Connected Services subscription

**Node.js Implementation:**
```bash
npm install smartcar
```

```typescript
import Smartcar from 'smartcar';

const client = new Smartcar.AuthClient({
  clientId: process.env.SMARTCAR_CLIENT_ID,
  clientSecret: process.env.SMARTCAR_CLIENT_SECRET,
  redirectUri: 'https://yourapp.com/callback',
  mode: 'live'
});

// After OAuth flow, get vehicle data
const vehicle = new Smartcar.Vehicle(vehicleId, accessToken);

// Get location
const location = await vehicle.location();
console.log(location); // { latitude: 33.xxx, longitude: -112.xxx }

// Get fuel level
const fuel = await vehicle.fuel();
console.log(fuel); // { percentRemaining: 0.75, range: 320 }

// Lock doors
await vehicle.lock();

// Unlock doors
await vehicle.unlock();
```

**Pricing:** Free tier available (limited calls), paid plans for production

**Resources:**
- [Smartcar Toyota Integration](https://smartcar.com/brand/toyota)
- [Smartcar API Docs](https://smartcar.com/docs/api)
- [Smartcar Node.js SDK](https://github.com/smartcar/node-sdk)

---

#### Option 2: Toyota Connected Services (Official App)

**Feasibility: LOW for API** - No public developer API

Toyota's official app provides:
- Remote Start (subscription required)
- Lock/Unlock
- Vehicle Status
- Last Parked Location
- Guest Driver monitoring

**Limitation:** No public API. Only accessible via Toyota App.

**Subscription:** Required after trial period (~$8/month or ~$80/year)

---

#### Option 3: Home Assistant Integration

**Feasibility: MEDIUM** - Community integration

If you use Home Assistant for home automation:

```yaml
# configuration.yaml
toyota:
  username: !secret toyota_username
  password: !secret toyota_password
  region: usa
```

Enables automations like:
- "When I arrive home, unlock front door"
- "Morning report: Tundra fuel level and location"

**Resources:**
- [Home Assistant Toyota Integration](https://www.home-assistant.io/integrations/toyota/)

---

### Automation Examples

```typescript
// apps/gs-site/app/api/vehicle/location/route.ts
import Smartcar from 'smartcar';

export async function GET() {
  const vehicle = new Smartcar.Vehicle(
    process.env.TUNDRA_VEHICLE_ID,
    process.env.SMARTCAR_ACCESS_TOKEN
  );

  const location = await vehicle.location();
  return Response.json(location);
}
```

```typescript
// Trigger: Arrived at property showing
// Action: Log mileage for expense tracking
const odometer = await vehicle.odometer();
await supabase.from('mileage_logs').insert({
  date: new Date(),
  odometer: odometer.distance,
  purpose: 'Property showing'
});
```

---

## Sony a7III

### Quick Specs
- **Type:** Full-frame mirrorless camera
- **Connectivity:** WiFi, USB, NFC
- **SDK Support:** Limited (older model)

---

### Integration Options

#### Option 1: USB Tethering with libgphoto2 (RECOMMENDED)

**Feasibility: HIGH** - Works reliably via USB

libgphoto2 is the most reliable way to control the a7III programmatically.

**Install gphoto2:**
```bash
# macOS
brew install gphoto2

# Linux
sudo apt install gphoto2 libgphoto2-dev
```

**CLI Usage:**
```bash
# List connected cameras
gphoto2 --auto-detect

# Capture image
gphoto2 --capture-image-and-download

# Get camera config
gphoto2 --list-config

# Set ISO
gphoto2 --set-config iso=800

# Set aperture
gphoto2 --set-config f-number=2.8

# Capture to specific folder
gphoto2 --capture-image-and-download --filename ~/photos/%Y%m%d_%H%M%S.jpg
```

**Node.js Wrapper:**
```bash
npm install gphoto2
```

```typescript
import { GPhoto2 } from 'gphoto2';

const gphoto = new GPhoto2();

// List cameras
gphoto.list((cameras) => {
  if (cameras.length === 0) return;

  const camera = cameras[0];
  console.log('Found:', camera.model);

  // Take photo
  camera.takePicture({ download: true }, (err, data) => {
    fs.writeFileSync('photo.jpg', data);
  });
});
```

**Resources:**
- [gphoto2 Documentation](http://gphoto.org/doc/)
- [gphoto2 npm package](https://www.npmjs.com/package/gphoto2)

---

#### Option 2: Sony WiFi API (Limited)

**Feasibility: LOW** - Archived, limited functionality on a7III

Sony's WiFi API exists but is deprecated and has minimal support for the a7III.

**Python Library (if needed):**
```bash
pip install libsonyapi
```

```python
from libsonyapi.camera import Camera

camera = Camera()
camera.connect()

# Basic operations
camera.take_photo()
camera.start_record()
camera.stop_record()
```

**Limitations:**
- No live view streaming on a7III
- Limited settings control
- Connection can be unreliable

**Resources:**
- [libsonyapi (Python)](https://github.com/petabite/libsonyapi)
- [sonypy (Python)](https://github.com/storborg/sonypy)

---

#### Option 3: Sony Camera Remote SDK (Official)

**Feasibility: LOW for a7III** - Best for newer models

Sony's official SDK primarily supports:
- Sony A1
- Sony A7S III
- Sony A7 IV
- Sony A7R V

The a7III has limited compatibility.

**Resources:**
- [Sony Camera Remote SDK](https://support.d-imaging.sony.co.jp/app/sdk/en/index.html)
- [Camera Remote Toolkit](https://pro.sony/en_BA/digital-imaging/camera-remote-toolkit)

---

### Automation Examples

```typescript
// Automated product photography workflow
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function captureProduct(productId: string) {
  const filename = `products/${productId}_${Date.now()}.jpg`;

  // Capture via gphoto2
  await execAsync(`gphoto2 --capture-image-and-download --filename ${filename}`);

  // Upload to Supabase Storage
  const file = fs.readFileSync(filename);
  await supabase.storage
    .from('product-photos')
    .upload(filename, file, { contentType: 'image/jpeg' });

  return filename;
}
```

```bash
# Timelapse script (cron every 5 min)
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
gphoto2 --capture-image-and-download --filename ~/timelapse/$TIMESTAMP.jpg
```

---

### Camera Settings Reference

Common gphoto2 config options for a7III:

| Setting | Command |
|---------|---------|
| ISO | `--set-config iso=100` |
| Aperture | `--set-config f-number=2.8` |
| Shutter Speed | `--set-config shutterspeed=1/250` |
| White Balance | `--set-config whitebalance=Auto` |
| Focus Mode | `--set-config focusmode=AF-S` |
| Image Quality | `--set-config imagequality=RAW+JPEG` |

---

## Other Devices

*Add additional hardware below as needed*

| Device | Type | Integration Status |
|--------|------|-------------------|
| Brother MFC-J6540DW | Printer/Scanner | Documented |
| Mac Studio | Bridge/Server | Documented |
| Toyota Tundra 2024 | Vehicle | Documented |
| Sony a7III | Camera | Documented |
| *TBD* | - | - |

---

## Hardware Inventory

> Full list of owned devices and equipment

### Computers & Mobile

| Device | Notes |
|--------|-------|
| Mac Studio | Always-on, Tailscale bridge, home server |
| MacBook Pro 2019 | Laptop |
| iPhone 14 Pro Max | Primary phone |
| Apple Vision Pro | Spatial computing |
| AirPods Pro | Wireless earbuds, ANC |
| AirPods Max | Over-ear headphones, ANC |

### Camera & Lighting

| Device | Notes |
|--------|-------|
| Sony a7III | Full-frame mirrorless camera |
| Promaster LED Bi-Color Light (x2) | Standing lights, video/photo |

### Audio & Speakers

| Device | Notes |
|--------|-------|
| JBL 4 Speaker | Portable Bluetooth speaker |

### Health & Wellness

| Device | Notes |
|--------|-------|
| Theragun | Percussion massage device |

### Vehicle

| Device | Notes |
|--------|-------|
| Toyota Tundra 2024 Platinum | Primary vehicle, Connected Services |

### Kitchen Appliances

| Device | Notes |
|--------|-------|
| *TBD* | Add specific appliances |

---

**Last Updated:** December 22, 2024
