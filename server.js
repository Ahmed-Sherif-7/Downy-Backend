const express = require("express");
const ytdl = require("@distube/ytdl-core");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const Youtube = require("youtube-search-api");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/search", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    const results = await Youtube.GetListByKeyword(q, false, 3);

    if (!results.items || results.items.length === 0) {
      return res.status(404).json({ error: "No videos found" });
    }

    const videos = results.items
      .filter(item => item.type === "video")
      .map(item => ({
        title: item.title,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        thumbnail: item.thumbnail.thumbnails[0].url
      }));

    res.json({ results: videos });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

app.get("/api/download", async (req, res) => {
  const { url } = req.query;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_");
    res.header("Content-Disposition", `attachment; filename="${title}.mp3"`);

    ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
    }).pipe(res);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🎧 Server running at http://localhost:${PORT}`));
