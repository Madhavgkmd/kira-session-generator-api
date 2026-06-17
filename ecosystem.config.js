export default {
  apps: [{
    name: "kris-bot-inc",
    script: "./app.js",
    autorestart: true,
    max_memory_restart: "500M"
  }]
};