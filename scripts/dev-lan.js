const { spawn } = require("child_process");
const os = require("os");

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal && net.address.startsWith("192.168.")) {
        return net.address;
      }
    }
  }
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

function getTailscaleIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal && net.address.startsWith("100.")) {
        return net.address;
      }
    }
  }
  return null;
}

const lanIp = getLanIp();
const tailscaleIp = getTailscaleIp();
const port = process.env.PORT || "3000";

console.log("");
console.log("========================================");
console.log("  ACESSE NO CELULAR (mesmo Wi-Fi):");
if (lanIp) {
  console.log(`  http://${lanIp}:${port}`);
} else {
  console.log("  (IP Wi-Fi não detectado — rode: hostname -I)");
}
if (tailscaleIp) {
  console.log("");
  console.log("  OU via Tailscale (celular com app instalado):");
  console.log(`  http://${tailscaleIp}:${port}`);
}
console.log("");
console.log("  NÃO use http://0.0.0.0 — isso não funciona!");
console.log("========================================");
console.log("");

const child = spawn("npx", ["next", "dev", "-H", "0.0.0.0", "-p", port], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
