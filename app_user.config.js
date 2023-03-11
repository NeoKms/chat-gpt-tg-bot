module.exports = {
  apps: [
    {
      error_file: "/var/log/pm2_err.log",
      out_file: "/var/log/pm2_out.log",
      name: "app_user",
      script: "npm",
      watch: false,
      args: "run start:user",
      cwd: "/var/www/app",
    },
  ],
};
