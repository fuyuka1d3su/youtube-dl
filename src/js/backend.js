const youtubedl = require("youtube-dl-exec");
const fs = require("fs");
const path = require("path");
const { ipcRenderer } = require("electron");
const currentDate = new Date().valueOf();

showRecentVids();

function open(path) {
  const shell = require("electron").shell;
  shell.openExternal(path);
}

function getVideo() {
  const link = document.getElementById("search link").value;
  const loading = document.getElementById("loading container");

  loading.style.display = "block"; // Displays the loading animation
  youtubedl(link, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    addHeader: ["referer:youtube.com", "user-agent:googlebot"],
  })
    .then((output) => {
      loading.style.display = "none";
      writeVideo(output);
      location.reload();
      console.log(output);
    })
    .catch(function (error) {
      loading.style.display = "none";
      console.log(error);
      messageBox({
        title: "Error while adding video",
        type: "error",
        message:
          "An error occured while adding the video. Make sure you provided a valid link.",
      });
    });
}

function showRecentVids() {
  const recentVidListContainer = document.getElementById("recent container");
  let title;
  let img;
  let channelAndTimestamp;
  let openDirectory;
  let openInBrowser;
  let copyLinkVid;
  let deleteVideoButton;
  let recentVids = readRecentVids();

  if (recentVids.length == 0) {
    let emptyText = document.getElementById("video empty");
    emptyText.innerHTML = "There are no current recent videos";
  } else {
    for (var vid of recentVids) {
      // First column

      console.log(vid);
      const recentVidContainer = document.createElement("div");
      const downloadMergedButton = document.createElement("button");
      const downloadAudioOnlyButton = document.createElement("button");
      const downloadVideoOnlyButton = document.createElement("button");
      let columnDiv = document.createElement("div");

      recentVidContainer.className = "recentVid container";

      // Vid thumb
      img = document.createElement("img");
      img.src = vid.thumbnail;
      img.className = "recentVid thumbnail";
      columnDiv.append(img);

      columnDiv.className = "column";
      recentVidContainer.append(columnDiv);

      // Second column (vid info)

      columnDiv = document.createElement("div");

      // Vid title
      title = document.createElement("h3");
      if (vid.title.length > 75) {
        title.innerHTML = vid.title.substr(0, 62) + "...";
        title.title = vid.title;
      } else {
        title.innerHTML = vid.title;
      }
      title.className = "recentvid title";
      columnDiv.append(title);

      // Vid channel and timestamp
      channelAndTimestamp = document.createElement("p");
      channelAndTimestamp.innerHTML =
        vid.channel + "・Added " + timeConverter(vid.dateAdded);
      channelAndTimestamp.className = "recentvid channelAndTime";
      columnDiv.append(channelAndTimestamp);

      columnDiv.append(document.createElement("br"));
      columnDiv.append(document.createElement("br"));

      // Open directory in explorer

      openDirectory = document.createElement("button");
      img = document.createElement("img");
      openDirectory.onclick = () => open(path.dirname(vid.path));
      openDirectory.className = "recentVid smallImgButton";

      img.src = "./assets/open_folder.png";

      openDirectory.append(img);
      columnDiv.append(openDirectory);

      // Open URL in browser

      openInBrowser = document.createElement("button");
      img = document.createElement("img");
      openInBrowser.onclick = () => open(vid.url);
      openInBrowser.className = "recentVid smallImgButton";

      img.src = "./assets/open.png";

      openInBrowser.append(img);
      columnDiv.append(openInBrowser);

      // Copy Button

      copyLinkVid = document.createElement("button");
      img = document.createElement("img");
      copyLinkVid.onclick = function () {
        navigator.clipboard.writeText(vid.url);
        copyLinkVid.style.border = "2px solid rgb(23, 201, 0)";
        sleep(500);
        copyLinkVid.style.border = "2px solid rgb(61, 0, 117)";
      };
      copyLinkVid.className = "recentVid smallImgButton";

      img.src = "./assets/copy.png";

      copyLinkVid.append(img);
      columnDiv.append(copyLinkVid);

      // Delete vid button

      deleteVideoButton = document.createElement("button");
      img = document.createElement("img");
      deleteVideoButton.onclick = () => {
        deleteVideoButton.style.border = "2px solid red";
        deleteVideo(vid);
      };

      deleteVideoButton.className = "recentVid smallImgButton";

      img.src = "./assets/delete.png";

      deleteVideoButton.append(img);
      columnDiv.append(deleteVideoButton);

      // Download vid+audio merged button

      downloadMergedButton.innerHTML = "Audio + Video";
      downloadMergedButton.className = "recentVid download";
      downloadMergedButton.onclick = () =>
        downloadVideoMerged(vid, viewVidOnYT);
      columnDiv.append(downloadMergedButton);

      // Download audio only button

      downloadAudioOnlyButton.innerHTML = "Audio (flac)";
      downloadAudioOnlyButton.className = "recentVid download";
      downloadAudioOnlyButton.onclick = () =>
        downloadAudioOnly(vid, downloadAudioOnlyButton);
      columnDiv.append(downloadAudioOnlyButton);

      // Download vid only button

      downloadVideoOnlyButton;
      downloadVideoOnlyButton.innerHTML = "Video (mp4)";
      downloadVideoOnlyButton.className = "recentVid download";
      downloadVideoOnlyButton.onclick = () =>
        downloadVideoOnly(vid, downloadVideoOnlyButton);
      columnDiv.append(downloadVideoOnlyButton);

      columnDiv.className = "column";
      recentVidContainer.append(columnDiv);
      recentVidListContainer.append(recentVidContainer);
    }
  }
}

function readRecentVids() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "/json/recentvids.json"))
  );
}

function messageBox(options) {
  return ipcRenderer.invoke("showDialog", options);
}

function clearList() {
  messageBox({
    title: "Clear list",
    type: "warning",
    message: "Are you sure you want to clear the recent videos list?",
    buttons: ["yes", "no"],
  }).then((res) => {
    if (res === 0) {
      // if user accepted
      fs.writeFileSync(path.join(__dirname, "/json/recentvids.json"), "[]");
      window.location.reload();
    }
  });
}

function deleteVideo(video) {
  messageBox({
    title: "Delete video",
    type: "warning",
    message:
      "Are you sure you want to delete the video? This will delete the video file from your computer.",
    buttons: ["yes", "no"],
  }).then((res) => {
    if (res === 0) {
      // if user accepted
      let recentVids = readRecentVids();
      let vidToRemove;

      let newRecentVids = recentVids.filter(function (vid) {
        // returns list of vids without the video
        if (vid.id == video.id) {
          vidToRemove = vid;
        }
        return vid.id != video.id;
      });

      console.log(vidToRemove + " to remove");

      fs.writeFileSync(
        path.join(__dirname, "/json/recentvids.json"),
        JSON.stringify(newRecentVids)
      );

      fs.rm(vidToRemove.path);
    }
    window.location.reload();
  });
}

function writeVideo(video) {
  let recentVids = readRecentVids();

  for (var vid of recentVids) {
    if (vid.id == video.id) {
      messageBox({
        title: "Duplicate video found.",
        type: "error",
        message: "You already added this video!",
      });
      return;
    }
  }

  recentVids.unshift({
    title: video.title,
    thumbnail: video.thumbnail,
    channel: video.channel,
    url: video.webpage_url,
    dateAdded: currentDate,
    id: video.id,
    path: null,
  });

  fs.writeFileSync(
    path.join(__dirname, "/json/recentvids.json"),
    JSON.stringify(recentVids)
  );
}

function downloadAudioOnly(videoToDL, downloadButton) {
  ipcRenderer
    .invoke("showSaveDialog", {
      defaultPath: "~/" + videoToDL.title + ".flac",
    })
    .then((p) => {
      let directory = path.dirname(p);

      downloadButton.style.border = "2px solid grey";

      youtubedl(videoToDL.url, {
        resizeBuffer: true,
        format: "ba",
        extractAudio: true,
        ffmpegLocation:
          "C:\\Users\\akihito\\Documents\\Youtube\\setto\\ffmpeg-bin\\ffmpeg.exe",
        verbose: true,
        resizeBuffer: true,
        addMetadata: true,
        audioFormat: "flac",
        embedThumbnail: true,
        output: p,
      })
        .catch(function (error) {
          console.log(error);
          downloadButton.style.border = "2px solid red";
          return;
        })
        .then(() => {
          downloadButton.style.border = "2px solid rgb(23, 201, 0)";
          let recentVids = readRecentVids();

          for (var vid of recentVids) {
            if (vid.id == videoToDL.id) {
              vid.path = p;
              break;
            }
          }

          fs.writeFileSync(
            path.join(__dirname, "/json/recentvids.json"),
            JSON.stringify(recentVids)
          );

          open(directory);
        });
    });
}

function downloadVideoOnly(videoToDL, downloadButton) {
  ipcRenderer
    .invoke("showSaveDialog", {
      defaultPath: "~/" + videoToDL.title + "[" + videoToDL.id + "]" + ".mp4",
    })
    .then((p) => {
      let directory = path.dirname(p);

      downloadButton.style.border = "2px solid grey";

      youtubedl(videoToDL.url, {
        output: p,
        resizeBuffer: true,
        format: "bv",
      })
        .catch(function (error) {
          console.log(error);
          downloadButton.style.border = "2px solid red";
          return;
        })
        .then(() => {
          downloadButton.style.border = "2px solid rgb(23, 201, 0)";
          let recentVids = readRecentVids();

          for (var vid of recentVids) {
            if (vid.id == videoToDL.id) {
              vid.path = p;
              break;
            }
          }

          fs.writeFileSync(
            path.join(__dirname, "/json/recentvids.json"),
            JSON.stringify(recentVids)
          );

          open(directory);
        });
    });
}

function downloadVideoMerged(videoToDL, downloadButton) {
  ipcRenderer
    .invoke("showSaveDialog", {
      defaultPath: "~/" + videoToDL.id + ".mp4",
    })
    .then((p) => {
      let directory = path.dirname(p);

      downloadButton.style.border = "2px solid grey";

      youtubedl(videoToDL.url, {
        output: p,
        resizeBuffer: true,
        //format: "bv+ba/b",
        downloader: "http" + ffmpeg.path,
      })
        .catch(function (error) {
          console.log(error);
          downloadButton.style.border = "2px solid red";
          return;
        })
        .then(() => {
          downloadButton.style.border = "2px solid rgb(23, 201, 0)";
          let recentVids = readRecentVids();

          for (var vid of recentVids) {
            if (vid.id == videoToDL.id) {
              vid.path = p;
              break;
            }
          }

          fs.writeFileSync(
            path.join(__dirname, "/json/recentvids.json"),
            JSON.stringify(recentVids)
          );

          open(directory);
        });
    });
}

// Date funcs
function timeDifference(current, previous) {
  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;

  var elapsed = current - previous;

  if (elapsed < msPerMinute) {
    return "Just now";
  } else if (elapsed < msPerHour) {
    return (
      Math.floor(elapsed / msPerMinute) +
      ` minute${Math.floor(elapsed / msPerMinute) == 1 ? "" : "s"} ago`
    );
  } else if (elapsed < msPerDay) {
    return (
      Math.floor(elapsed / msPerHour) +
      ` hour${Math.floor(elapsed / msPerHour) == 1 ? "" : "s"} ago`
    );
  } else if (elapsed < msPerMonth) {
    return (
      Math.floor(elapsed / msPerDay) +
      ` day${Math.floor(elapsed / msPerDay) == 1 ? "" : "s"} ago`
    );
  } else if (elapsed < msPerYear) {
    return (
      Math.floor(elapsed / msPerMonth) +
      ` month${Math.floor(elapsed / msPerMonth) == 1 ? "" : "s"} ago`
    );
  } else {
    console.log(elapsed);
    return (
      Math.floor(elapsed / msPerYear) +
      ` year${Math.floor(elapsed / msPerYear) == 1 ? "" : "s"} ago`
    );
  }
}
// Convert UNIX timestamp to human readable time
function timeConverter(UNIX_timestamp) {
  var a = new Date(UNIX_timestamp);
  var months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = pad(a.getHours(), 2);
  var min = pad(a.getMinutes(), 2);
  var time = date + " " + month + " " + year + ", " + hour + ":" + min;
  return time;
}
function pad(num, size) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}
