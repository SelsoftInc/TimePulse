module.exports = {
  apps: [
    {
      name: 'timepulse-frontend',
      cwd: '/home/ubuntu/TimePulse/nextjs-app',
      script: 'npm',
      args: 'run dev -- --hostname 0.0.0.0 --port 3000',
    },
    {
      name: 'timepulse-server',
      cwd: '/home/ubuntu/TimePulse/server',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 5001
      }
    },
    {
      name: 'timepulse-engine',
      cwd: '/home/ubuntu/TimePulse/engine',
      script: 'uv',
      args: 'run uvicorn main:app --host 0.0.0.0 --port 8000',
      interpreter: 'none',
    }
  ]
};