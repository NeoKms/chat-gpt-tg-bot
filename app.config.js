module.exports = {
  apps: [
    {
      error_file: "/var/log/pm2_err.log",
      out_file: "/var/log/pm2_out.log",
      name: "app",
      script: "npm",
      watch: false,
      args: "run start:app",
      cwd: "/var/www/app",
    },
  ],
};
