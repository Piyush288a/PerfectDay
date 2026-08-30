import fs from "fs";
import path from "path";

const searchDir = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === "node_modules" || file === ".git" || file === "dist") continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith(".js") || file.endsWith(".html") || file.endsWith(".css") || file.endsWith(".json")) {
      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes("remember") || (line.toLowerCase().includes("disabled") && line.toLowerCase().includes("remember"))) {
          console.log(`${fullPath}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }
};

console.log("Searching for remember / disabled in project...");
searchDir("S:/PROJECTS/PerfectDay");
