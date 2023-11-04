
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const libre = require("libreoffice-convert");

const app = express();
const port = 3004;

// Define the upload directory and file storage using Multer
const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "convertedPDFs");
 
// Create the directories if they don't exist
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.get("/", async (req, res) => {
  const indexPath = path.join(__dirname, "index.html");
  res.sendFile(indexPath);
});

app.post("/docToPdf", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const inputPath = req.file.path;
  const outputFilePath = path.join(outputDir, `${Date.now()}_output.pdf`);

  const file = fs.readFileSync(inputPath);

  libre.convert(
    file,
    ".pdf",
    undefined,
    (err, done) => {
      if (err) {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputFilePath);
        return res.send("Some error occurred in the conversion process");
      }

      fs.writeFileSync(outputFilePath, done);

      res.download(outputFilePath, (err) => {
        if (err) {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputFilePath);
          return res.send("Some error occurred in downloading the file");
        }
      });
    }
  );
});

app.listen(port, () => {
  console.log("Server is listening on port 3004");
});
