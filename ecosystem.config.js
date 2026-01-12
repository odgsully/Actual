// ============================================================================
// LEGACY FILE - DISCONTINUED (January 2025)
// ============================================================================
// This PM2 configuration was used for Hetzner deployment.
// Production now runs on Vercel. This file is kept for historical reference.
//
// Current deployment: Vercel (see vercel.json)
// Deploy command: vercel --prod
// ============================================================================

// PM2 Configuration for GS Personal App Suite (Monorepo)
// This file manages all Node.js processes on the server
//
// App routing (via Nginx):
//   /              → GS Site Dashboard (port 3003)
//   /wabbit-re/*   → Wabbit RE - Real estate ranking (port 3000)
//   /wabbit/*      → Wabbit - General ranking (port 3002)
//   /gsrealty/*    → GSRealty Client - CRM (port 3004)

const commonConfig = {
  instances: 1,
  exec_mode: 'fork',
  autorestart: true,
  watch: false,
  max_memory_restart: '512M',
  min_uptime: '10s',
  listen_timeout: 3000,
  kill_timeout: 5000,
  restart_delay: 4000,
  max_restarts: 10,
  merge_logs: true,
  time: true,
  ignore_watch: [
    'node_modules',
    '.next',
    'logs',
    '.git',
    'public/uploads'
  ],
};

module.exports = {
  apps: [
    // ============================================
    // GS Site Dashboard (Root - port 3003)
    // ============================================
    {
      ...commonConfig,
      name: 'gs-site',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/wabbit/apps/gs-site',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      error_file: '/var/log/pm2/gs-site-error.log',
      out_file: '/var/log/pm2/gs-site-out.log',
      log_file: '/var/log/pm2/gs-site-combined.log',
    },

    // ============================================
    // Wabbit RE - Real Estate Ranking (port 3000)
    // ============================================
    {
      ...commonConfig,
      name: 'wabbit-re',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/wabbit/apps/wabbit-re',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pm2/wabbit-re-error.log',
      out_file: '/var/log/pm2/wabbit-re-out.log',
      log_file: '/var/log/pm2/wabbit-re-combined.log',
    },

    // ============================================
    // Wabbit - General Ranking (port 3002)
    // ============================================
    {
      ...commonConfig,
      name: 'wabbit',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/wabbit/apps/wabbit',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      error_file: '/var/log/pm2/wabbit-error.log',
      out_file: '/var/log/pm2/wabbit-out.log',
      log_file: '/var/log/pm2/wabbit-combined.log',
    },

    // ============================================
    // GSRealty Client - CRM (port 3004)
    // ============================================
    {
      ...commonConfig,
      name: 'gsrealty',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/wabbit/apps/gsrealty-client',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
      error_file: '/var/log/pm2/gsrealty-error.log',
      out_file: '/var/log/pm2/gsrealty-out.log',
      log_file: '/var/log/pm2/gsrealty-combined.log',
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: '5.78.100.116',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/wabbit.git',
      path: '/var/www/wabbit',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      ssh_options: 'StrictHostKeyChecking=no'
    }
  }
}
