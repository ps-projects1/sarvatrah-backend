const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(
  process.cwd(),
  "debug.log"
);

function writeLog(data) {
  try {
    const timestamp =
      new Date().toISOString();

    const line =
      `[${timestamp}] ` +
      JSON.stringify(
        data,
        null,
        2
      ) +
      "\n\n";

    fs.appendFileSync(
      LOG_FILE,
      line
    );
  } catch (err) {
    console.error(
      "Logger Error:",
      err
    );
  }
}

module.exports = {
  writeLog,
};