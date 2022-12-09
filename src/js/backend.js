const youtubedl = require("youtube-dl-exec");
const fs = require("fs");
const path = require("path");
const { channel } = require("diagnostics_channel");

showRecentVids();

function getVideo() {
  const link = document.getElementById("search link").value;
  const loading = document.getElementById("loading container");

  loading.hidden = false;
  youtubedl(link, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: ["referer:youtube.com", "user-agent:googlebot"],
  }).then((output) => {
    loading.hidden = true;
    writeVideo(output);
    location.reload();
    console.log(output);
  });
}

function showRecentVids() {
  recentVids = readRecentVids();
  const recentVidListContainer = document.getElementById("recent container");
  let title;
  let img;
  let channel;

  for (var vid of recentVids) {
    console.log(vid);
    const recentVidContainer = document.createElement("div");
    recentVidContainer.style.display = "flex";
    recentVidContainer.style.backgroundColor = "#1f1f1f";
    recentVidContainer.style.borderRadius = "15px";
    recentVidContainer.className = "listContainer";
    recentVidContainer.style.marginBottom = "25px";
    recentVidContainer.style.cursor = "pointer";
    recentVidContainer.onclick = function () {
      const shell = require("electron").shell;
      shell.openExternal(vid.url);
    };

    img = document.createElement("img");
    img.src = vid.thumbnail;
    img.style.height = "120px";
    img.style.width = "213.33px";
    img.style.padding = "5px 5px 5px";
    img.style.borderRadius = "15px";
    recentVidContainer.append(img);

    title = document.createElement("h3");
    title.innerHTML = "\n" + vid.title;
    title.style.marginTop = "5px";
    title.style.padding = "5px 5px 5px 5px";
    recentVidContainer.append(title);

    channel = document.createElement("h4");
    channel.innerHTML = vid.channel;
    channel.style.display = "block";
    recentVidContainer.append(channel);

    recentVidListContainer.append(recentVidContainer);
  }
}

function readRecentVids() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "/json/recentvids.json"))
  );
}

function clearList() {
  fs.writeFileSync(path.join(__dirname, "/json/recentvids.json"), "[]");
  window.location.reload();
}

function writeVideo(video) {
  recentVids = readRecentVids();

  recentVids.push({
    title: video.title,
    thumbnail: video.thumbnail,
    channel: video.channel,
    url: video.webpage_url,
  });

  fs.writeFileSync(
    path.join(__dirname, "/json/recentvids.json"),
    JSON.stringify(recentVids)
  );
}
