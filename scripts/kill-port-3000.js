// Windows'ta 3000 portunu kullanan işlemi kapatır (Node ile)
const { execSync } = require("child_process");
const os = require("os");

function killPort3000() {
  try {
    if (os.platform() === "win32") {
      let out = "";
      try {
        out = execSync('netstat -ano | findstr :3000', { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
      } catch (_) {
        console.log("Port 3000 zaten boş.");
        return;
      }
      const lines = out.split("\n").filter((l) => l.includes("LISTENING"));
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "pipe" });
          console.log("Port 3000 kapatıldı (PID " + pid + ")");
        } catch (_) {}
      }
      if (pids.size === 0) console.log("Port 3000 zaten boş.");
    } else {
      execSync("lsof -ti:3000 | xargs kill -9 2>/dev/null", { stdio: "pipe" });
      console.log("Port 3000 kapatıldı.");
    }
  } catch (e) {
    if (e.status !== 1) console.warn("kill-port:", e.message || "Port boş olabilir.");
  }
}

killPort3000();
