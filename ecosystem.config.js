// PM2 Configuration for Wabbit Production
// This file manages the Node.js process on the server

module.exports = {
  apps: [{
    name: 'wabbit',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/wabbit',
    instances: 1, // Use 1 instance for CPX11 (2 vCPU)
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    
    // Logging
    error_file: '/var/log/pm2/wabbit-error.log',
    out_file: '/var/log/pm2/wabbit-out.log',
    log_file: '/var/log/pm2/wabbit-combined.log',
    time: true,
    
    // Advanced features
    min_uptime: '10s',
    listen_timeout: 3000,
    kill_timeout: 5000,
    
    // Restart strategy
    restart_delay: 4000,
    max_restarts: 10,
    
    // Monitoring
    instance_var: 'INSTANCE_ID',
    merge_logs: true,
    
    // Auto restart on file changes (disabled in production)
    ignore_watch: [
      'node_modules',
      '.next',
      'logs',
      '.git',
      'public/uploads'
    ],
    
    // Environment specific to production
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    }
  }],

  // Deployment configuration (optional, for PM2 deploy)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
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