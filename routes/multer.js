const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const storage = multer.memoryStorage(); // Store files in memory instead of on disk

const upload = multer({ storage: storage });

module.exports = upload;
