const youtubedl = require("youtube-dl-exec");
const fs = require("fs");
const path = require("path");
const { ipcRenderer } = require("electron");
const currentDate = new Date().valueOf();
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const ffmpeg = require("fluent-ffmpeg");
const tempDir = require("os").tmpdir() + "\\" + "Setto\\";
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

showRecentVids();

function open(path) {
  const shell = require("electron").shell;
  shell.openExternal(path);
}

// Get the input field
var input = document.getElementById("search link");

// Execute a function when the user presses a key on the keyboard
input.addEventListener("keypress", function (event) {
  // If the user presses the "Enter" key on the keyboard
  if (event.key === "Enter") {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    document.getElementById("searchButton").click();
  }
});

function pasteFromClipboard() {
  const loading = document.getElementById("loading container");
  loading.style.display = "block"; // Displays the loading animation
  navigator.clipboard.readText().then((res) => {
    let link = res;
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
            'An error occured while adding the video "' +
            link +
            '". Make sure you provided a valid link.',
        });
      });
  });
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
          'An error occured while adding the video "' +
          link +
          '". Make sure you provided a valid link.',
      });
    });
}

function showRecentVids() {
  const recentVidListContainer = document.getElementById("recent container");

  let recentVids = readRecentVids();

  if (recentVids.length == 0) {
    let emptyText = document.getElementById("video empty");
    emptyText.innerHTML = "There are no current recent videos";
  } else {
    for (let vid of recentVids) {
      // First column

      console.log(vid);
      const recentVidContainer = document.createElement("div");
      let downloadMergedButton = document.createElement("button");
      let downloadAudioOnlyButton = document.createElement("button");
      let downloadVideoOnlyButton = document.createElement("button");

      let title;
      let img;
      let channelAndTimestamp;
      let openDirectory;
      let openInBrowser;
      let copyLinkVid;
      let deleteVideoButton;
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
      if (vid.title.length > 50) {
        title.innerHTML = vid.title.substr(0, 60) + "...";
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

      // Open directory in explorer
      if (fs.existsSync(vid.path)) {
        openDirectory = document.createElement("button");
        img = document.createElement("img");
        openDirectory.onclick = () => open(path.dirname(vid.path));
        openDirectory.className = "recentVid smallImgButton";
        img.src = "./assets/open_folder.png";
        openDirectory.append(img);
        columnDiv.append(openDirectory);
      }

      // Open URL in browser
      openInBrowser = document.createElement("button");
      img = document.createElement("img");
      openInBrowser.onclick = function () {
        console.log(vid.url);
        open(vid.url);
      };
      openInBrowser.className = "recentVid smallImgButton";
      img.src = "./assets/open.png";
      openInBrowser.append(img);
      columnDiv.append(openInBrowser);

      // Copy Button
      copyLinkVid = document.createElement("button");
      img = document.createElement("img");
      copyLinkVid.onclick = function () {
        navigator.clipboard.writeText(vid.url);
        console.log("wrote " + vid.url + "to clipboard");
        copyLinkVid.style.border = "2px solid rgb(23, 201, 0)";
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
        downloadVideoMerged(vid, downloadMergedButton);
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
      let recentVids = readRecentVids();

      for (let video of recentVids) {
        fs.rmSync(video.path);
      }

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

  for (let vid of recentVids) {
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
  downloadButton.style.border = "2px solid grey";
  // gets the best video using yt-dlp and returns the path it saved it to
  ipcRenderer
    .invoke("showSaveDialog", {
      defaultPath: "~/" + videoToDL.title + "[" + videoToDL.id + "]" + ".flac",
      filters: [
        { name: "Audio Files", extensions: ["mp3", "flac", "wav"] },
        { name: "All Files", extensions: ["*"] },
      ],
    })
    .then((p) => {
      if (p) {
        getBestAudio(videoToDL, p).then(() => {
          downloadButton.style.border = "2px solid grey";
          let directory = path.dirname(p);

          downloadButton.style.border = "2px solid rgb(23, 201, 0)";
          let recentVids = readRecentVids();

          for (let vid of recentVids) {
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
      } else {
        downloadButton.style.border = "2px solid transparent";
        console.log("no path found");
      }
    });
}

function downloadVideoOnly(videoToDL, downloadButton) {
  downloadButton.style.border = "2px solid grey";
  // gets the best video using yt-dlp and returns the path it saved it to
  ipcRenderer
    .invoke("showSaveDialog", {
      defaultPath: "~/" + videoToDL.title + "[" + videoToDL.id + "]" + ".mp4",
      filters: [
        { name: "Video Files", extensions: ["mp4", "webm"] },
        { name: "All Files", extensions: ["*"] },
      ],
    })
    .then((p) => {
      // responds with path chosen
      if (p) {
        // if the path is not null
        getBestVideo(videoToDL, p).then(() => {
          downloadButton.style.border = "2px solid grey";
          let directory = path.dirname(p);

          downloadButton.style.border = "2px solid rgb(23, 201, 0)";
          let recentVids = readRecentVids();

          for (let vid of recentVids) {
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
      } else {
        downloadButton.style.border = "2px solid transparent";
        console.log("no path found");
      }
    });
}

function getBestVideo(video, p) {
  return new Promise(function (resolve, reject) {
    youtubedl(video.url, {
      output: p,
      resizeBuffer: true,
      format: "bv",
      ffmpegLocation:
        "C:\\Users\\akihito\\Documents\\Youtube\\setto\\ffmpeg-bin\\ffmpeg.exe",
      verbose: true,
      addMetadata: true,
    })
      .catch(function (error) {
        console.log(error);
        reject(false);
      })
      .then(() => {
        resolve(true);
      });
  });
}

function getBestAudio(video, p) {
  return new Promise(function (resolve, reject) {
    youtubedl(video.url, {
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
        messageBox({
          title: "An error occured",
          type: "error",
          message: error.toString(),
        });
        reject(false);
      })
      .then(() => {
        resolve(true);
      });
  });
}

function downloadVideoMerged(videoToDL, downloadButton) {
  downloadButton.style.border = "2px solid grey";
  let videoFile;
  let audioFile;
  // yt-dlp --resize-buffer -S "vcodec:h264,acodec:m4a" -f "bv+ba" --merge-output-format "mp4" "https://www.youtube.com/watch?v=-0eGnfMEqYE"
  //
  ipcRenderer
    .invoke("showSaveDialog", {
      defaultPath: "~/" + videoToDL.title + "[" + videoToDL.id + "]" + ".mp4",
      filters: [
        { name: "Video Files", extensions: ["mp4", "webm"] },
        { name: "All Files", extensions: ["*"] },
      ],
    })
    .then((p) => {
      if (p) {
        outputName = path.basename(p);
        dirName = path.dirname(p);

        getBestAudio(
          videoToDL,
          tempDir + "audio_" + videoToDL.id + ".flac"
        ).then(() => {
          audioFile = tempDir + "audio_" + videoToDL.id + ".flac";
          console.log(audioFile);
          getBestVideo(
            videoToDL,
            tempDir + "video_" + videoToDL.id + ".mp4"
          ).then(() => {
            videoFile = tempDir + "video_" + videoToDL.id + ".mp4";
            console.log(videoFile);

            // once both the video and audio files were downloaded
            // ffmpeg.exe -i videoFile -i audioFile -c copy -map 0:v:0 -map 1:a:0 p
            let err = false;
            var cmd = ffmpeg()
              .addInput(videoFile)
              .addInput(audioFile)
              .addOptions("-strict -2")
              .output(p)
              .outputOptions(["-c copy", "-map 0:v:0", "-map 1:a:0"])
              .on("start", function (commandLine) {
                console.log("Spawned Ffmpeg with command: " + commandLine);
              })
              .on("error", function (err) {
                messageBox({
                  title: "An error occured",
                  type: "error",
                  message: err.toString(),
                });
                err = true;
              })
              .on("end", () => {
                fs.rm(
                  tempDir,
                  {
                    recursive: true,
                    force: true,
                  },
                  (err) => {
                    console.log(err);
                  }
                ); // removes the temp dir

                if (err) {
                  downloadButton.style.border = "2px solid red";
                  messageBox({
                    title: "An error occured",
                    type: "error",
                    message: err.toString(),
                  });
                } else {
                  downloadButton.style.border = "2px solid rgb(23, 201, 0)";

                  let recentVids = readRecentVids();

                  for (let vid of recentVids) {
                    if (vid.id == videoToDL.id) {
                      vid.path = p;
                      break;
                    }
                  }

                  fs.writeFileSync(
                    path.join(__dirname, "/json/recentvids.json"),
                    JSON.stringify(recentVids)
                  );
                  open(dirName);
                }
              });
            cmd.run();
          });
        });
      } else {
        downloadButton.style.border = "2px solid transparent";
        console.log("no path found");
      }
    });
}

function parseYTDLPOutput(process) {
  process.stdout.setEncoding("utf8");
  process.stdout.on("data", function (data) {
    //Here is where the output goes
    var info = data.split(" ");
    if (info[0] === "\r[download]") {
      if (info[3] != "of") {
        console.log(info[3]);
        return info[3];
      } else {
        console.log(info[2]);
        return info[2];
      }
    }
  });
  process.stderr.on("data", function (data) {
    //Here is where the output goes
    console.log(data);
    return null;
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
