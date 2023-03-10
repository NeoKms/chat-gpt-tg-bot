module.exports = {
    apps: [
        {
            error_file: "/var/log/pm2_err.log",
            out_file: "/var/log/pm2_out.log",
            name: "app_bot",
            script: "npm",
            watch: false,
            args: "run start:bot",
            cwd: "/var/www/app",
        },
    ],
};