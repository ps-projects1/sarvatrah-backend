const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/debug-log", async (req, res) => {
  try {
    const logPath = path.join(
      process.cwd(),
      "debug.log"
    );

    if (!fs.existsSync(logPath)) {
      return res.send(
        "debug.log does not exist yet"
      );
    }

    const data = fs.readFileSync(
      logPath,
      "utf8"
    );

    res.setHeader(
      "Content-Type",
      "text/plain"
    );

    return res.send(data);

  } catch (err) {
    return res
      .status(500)
      .send(err.message);
  }
});

module.exports = router;