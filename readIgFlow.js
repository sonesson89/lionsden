import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { finished } from "stream/promises";

import * as dotenv from "dotenv";
dotenv.config();

import mailer from "./mailer.js";
import aiHelper from "./aiHelper.js";

const handleIdsIgnoreList = [
  "17853259464347467",
  "18040605845038274",
  "17863715873823073",
  "17941785606097116",
  "18075401279469154",
  "18327281965234279",
  "17911532709169280",
  "18137532583412158",
];

const INSTAGRAM_HANDLES = {
  "@leoeshagi": "Leo Eshagi",
  "@muaythaivik": "Viktor Schiller",
  "@_jacob_stenberg_": "Jacob Stenberg",
  "@jacobstenberg": "Jacob Stenberg",
  "@jockehaegg": "Joakim Hägg",
  "@jockehägg": "Joakim Hägg",
  "@nasim.kazem": "Nasim Kazem",
  "@mtflseries": "Muay Thai For Life Series",
  "@mtfl_series": "Muay Thai For Life Series",
  "@benjaminjavidi": "Benjamin Javidi",
  "@ecrobin": "Robin Sundlöf",
  "@angelo_1337": "Angelo Bennmo",
  "@bulldogthaiboxning": "Bulldog Thaiboxning",
  "@the_diamond_fight": "The Diamond Fight",
  "@blueatsa": "Poramin Atsa",
  "@monkeydtrochez": "Daniel Trochez",
  "@nicholasmbryant": "Nicholas Bryant",
  "@assouikfightnight": "Assouik Fight Night",
  "@samanthaguevararendon": "Samantha Guvera Rendon",
  "@julia.philippa": "Julia Philippa",
  "@jasminjalabian": "Jasmin Jalabian",
  "@noakwollsater": "Noak Wollsater",
  "@alexandra.andersrod": "Alexandra Andersröd",
  "@khalafpatrik": "Patrik Khalaf",
  "@alirezaamiri7": "Alireza Amiri",
  "@noahalic": "Noah Alic",
  "@031hisingen": "Nicklas Joabsson",
  "@alessandrolarsson": "Alessandro Larsson",
  "@marianneahlborg": "Marianne Ahlborg",
  "@daznboxing": "DAZN",
  "@daniella.eshagi": "Daniella Eshagi",
  "@lucaskano_": "Lucas Kano",
  "@ericwhibley": "Eric Whibley",
  "@kvarnan": "Simon Kvarnström",
  "@gbgmuaythai": "GBG Muay Thai",
  "@noel_ciba": "Noel Ciba",
  "@filiphwaldt": "Filip Waldt",
  "@nimadanielrafiei": "Nima Rafiei",
  "@motherfowolfs": "Rebecka Rudén",
};

const getTextBetween = (text, match1, match2) => {
  const indexOf1 = text.indexOf(match1);
  const indexOf2 = text.indexOf(match2);
  if (indexOf1 !== -1 && indexOf2 !== -1) {
    return text.slice(indexOf1 + match1.length, indexOf2);
  }
  return null;
};

const readFile = (file) =>
  new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", function (err, data) {
      if (err) {
        reject(err);
        log("ERROR: Could not read file " + file);
      } else {
        resolve(data);
      }
    });
  });

const readMarkdownFilesInDir = async (dirname) =>
  new Promise((resolve) => {
    const ids = [];
    fs.readdir(dirname, async function (err, filenames) {
      if (err) {
        console.error(err);
        return;
      }
      for (let i = 0; i < filenames.length; i++) {
        let filename = filenames[i];
        if (filename.endsWith(".md")) {
          const content = await readFile(dirname + filename);
          const text = getTextBetween(
            content,
            '<div class="postId" style="display: none;">',
            "</div>"
          );
          if (text && text.includes("ID: ")) {
            const id = text.replace("ID: ", "");
            ids.push(id);
          }
        }
      }
      resolve(ids);
    });
  });

const getCarouselChidlren = async (mediaId) => {
  try {
    const data = await fetch(
      `https://graph.instagram.com/${mediaId}/children?fields=id,media_url,media_type&access_token=${process.env.INSTAGRAM_GRAPH_API_TOKEN}`
    );
    const json = await data.json();
    return json;
  } catch (err) {
    log("ERROR: Could not fetch carousel children of post with id " + mediaId);
    mailer.sendErrorLogMail(
      "ERROR: Could not fetch carousel children of post with id " + mediaId,
      JSON.stringify(err, null, 4)
    );
    console.error("Could not fetch IG flow carousel");
  }
};

const shellCommand = (command) =>
  new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        log("ERROR: Could not execute the shell command: " + command);
        reject("ERROR");
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        log("ERROR: Could not execute the shell command: " + command);
        reject("STD_ERROR");
      }
      resolve(stdout);
    });
  });

const log = (message) => {
  const content = `${message}\n`;
  console.log(message);
  try {
    fs.writeFileSync("log.log", content, { flag: "a" });
  } catch (err) {
    console.error(err);
  }
};

const pushAndDeploy = async (postname) => {
  try {
    await shellCommand(`git add --all`);
    await shellCommand(
      `git commit -m "Automated news feed update from Raspberry Pi ${Date.now()}"`
    );
    await delay(1000);
    await shellCommand(`git push`);
    await delay(3000);
    //await shellCommand(`nvm use 12.5.0`);
    //await shellCommand(`hexo clean && hexo generate && hexo deploy`);
    //await shellCommand(`nvm use 18.7.0`);
  } catch (err) {
    log(
      "ERROR: Error found when trying to commit and push to Git, as well as deploying the site"
    );
    log(JSON.stringify(err, null, 4));
    await mailer.sendErrorLogMail(
      "Något gick fel när scriptet försökte pusha till git och deploya hemsidan",
      JSON.stringify(err, null, 4)
    );
  }
};

const hexoCreatePost = async (postname) => {
  try {
    const resp = await shellCommand(`hexo new post ${postname}`);
    console.log(resp);
    return resp;
  } catch (err) {
    log("ERROR: Could not create hexo post with postname: " + postname);
    log(JSON.stringify(err, null, 4));
    await mailer.sendErrorLogMail(
      "ERROR: Could not create hexo post with postname: " + postname,
      JSON.stringify(err, null, 4)
    );
  }
};

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });

const downloadImage = async (imageURL, downloadFilePath) => {
  try {
    const stream = fs.createWriteStream(downloadFilePath);
    const { body } = await fetch(imageURL);
    await finished(Readable.fromWeb(body).pipe(stream));
    return;
  } catch (err) {
    log(
      "ERROR: Could download the file with url: " +
        imageURL +
        " to: " +
        downloadFilePath
    );
    log(JSON.stringify(err, null, 4));
    await mailer.sendErrorLogMail(
      "ERROR: Could download the file with url: " +
        imageURL +
        " to: " +
        downloadFilePath,
      JSON.stringify(err, null, 4)
    );
  }
};

const run = async () => {
  // Get feed
  const data = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,permalink,thumbnail_url,timestamp,media_url,username,media_type&access_token=${process.env.INSTAGRAM_GRAPH_API_TOKEN}`
  );
  const json = await data.json();

  let newHexoPostsWereAdded = false;

  for (let i = 0; i < json.data.length; i++) {
    if (json.data[i].media_type === "CAROUSEL_ALBUM") {
      const children = await getCarouselChidlren(json.data[i].id);
      json.data[i].carouselChildren = children.data;
    }
  }

  const dir = path.join(process.env.DIRNAME, "/source/_posts/");
  const handledIds = await readMarkdownFilesInDir(dir);
  console.log("Current found IDs in markdown files:", handledIds);

  if (json.data && json.data.length > 0) {
    try {
      for (let i = 0; i < json.data.length; i++) {
        const item = json.data[i];
        if (
          !handledIds.includes(item.id) &&
          !handleIdsIgnoreList.includes(item.id + "")
        ) {
          console.log("item.caption", item.caption);
          let finalCaption = "";
          let suggestedTitle = "PLACEHOLDER TITLE";

          if (item.caption) {
            const captionClone = item.caption.split("").join("");
            const matches = captionClone.match(
              /[a-zA-Z0-9 åäöÅÄÖ!?,.:;\[\]()]/g
            );
            const cleanedCaption = matches ? matches.join("") : ""; // remove things like emojis
            finalCaption = cleanedCaption;
            //suggestedTitle = await aiHelper.getTitleInSwedish(cleanedCaption);
          }

          console.log("Suggested title 1: ", suggestedTitle);

          Object.keys(INSTAGRAM_HANDLES).forEach((key) => {
            const value = INSTAGRAM_HANDLES[key];
            key = key.replace("@", "");
            const key1 =
              key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
            const key2 = key1.toLowerCase();
            const key3 = key2.replaceAll("_", "");
            const key4 = key1.replaceAll("_", "");
            if (suggestedTitle) {
              suggestedTitle = suggestedTitle.replaceAll(key1, value);
              suggestedTitle = suggestedTitle.replaceAll(key2, value);
              suggestedTitle = suggestedTitle.replaceAll(key3, value);
              suggestedTitle = suggestedTitle.replaceAll(key4, value);
            }
          });

          suggestedTitle = suggestedTitle.replaceAll(
            /\([a-zA-Z0-9 ]{1,30}\)/g,
            ""
          ); // remove stuff between parenthesis
          suggestedTitle = suggestedTitle.replaceAll('"', "");
          suggestedTitle = suggestedTitle.replaceAll("  ", "");
          suggestedTitle = suggestedTitle.replaceAll(":", "");

          console.log("Suggested title 2: ", suggestedTitle);

          if (suggestedTitle) {
            item.title = suggestedTitle.split("").join(""); // clone
          } else {
            item.title = "Nyhet";
          }

          let postId;

          if (false /* suggestedTitle */) {
            postId = suggestedTitle
              .toLocaleLowerCase()
              .match(/[a-zA-Z0-9 åäö-]/g)
              .join("")
              .replaceAll(" ", "-")
              .replaceAll(/-{2,300}/g, "-") // remove duplicate dashes -
              .replaceAll("å", "a")
              .replaceAll("ä", "a")
              .replaceAll("ö", "o");

            if (postId.endsWith("-")) {
              postId = postId.slice(0, postId.length - 1); // removing trailing dash
            }
          } else {
            postId = `nyhet-${item.id}`;
          }

          const markdownPath = path.join(
            process.env.DIRNAME,
            `/source/_posts/${postId}.md`
          );

          if (!fs.existsSync(markdownPath)) {
            // Hexo-post for this IG-post doesn't already exists
            await hexoCreatePost(postId);
            await delay(500);

            const postFolderPath = path.join(
              process.env.DIRNAME,
              `/source/_posts/${postId}`
            );
            if (item.media_type === "IMAGE") {
              await downloadImage(item.media_url, `${postFolderPath}/1.jpg`);
            } else if (item.media_type === "CAROUSEL_ALBUM") {
              for (var j = 0; j < item.carouselChildren.length; j++) {
                const child = item.carouselChildren[j];
                if (child.media_type === "IMAGE") {
                  await downloadImage(
                    child.media_url,
                    `${postFolderPath}/${j + 1}.jpg`
                  );
                }
              }
            } else if (item.media_type === "VIDEO") {
              await downloadImage(item.media_url, `${postFolderPath}/1.mp4`);
            }

            const date = new Date(item.timestamp);

            const year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate();
            let hour = date.getHours();
            let minutes = date.getMinutes();
            let seconds = date.getSeconds();

            if (month < 10) month = `0${month}`;
            if (day < 10) day = `0${day}`;
            if (hour < 10) hour = `0${hour}`;
            if (minutes < 10) minutes = `0${minutes}`;
            if (seconds < 10) seconds = `0${seconds}`;

            let newCaption = finalCaption.replaceAll(/#[a-zA-Z]{1,20}/g, "");
            // Replace instagram handles with their real names
            // For instace, @ecrobin will translate to "Robin Sundlöf"
            Object.keys(INSTAGRAM_HANDLES).forEach((key) => {
              newCaption = newCaption.replaceAll(key, INSTAGRAM_HANDLES[key]);
            });
            console.log(item);

            let postPath = `/${year}/${month}/${day}/${postId}`;

            let markdownContent = `---
                        title: ${item.title}
                        date: ${year}-${month}-${day} ${hour}:${minutes}:${seconds}
                        tags:
                        ---
                        <div class="postId" style="display: none;">ID: ${
                          item.id
                        }</div>
                        ${
                          item.media_url && item.media_type === "IMAGE"
                            ? `
                        <div class="postImageContainer">
                            {% asset_img 1.jpg %}
                        </div>
                        `
                            : ""
                        }
                        ${
                          item.media_url && item.media_type === "VIDEO"
                            ? `
                        <video controls width="80%">
                            <source src="${postPath}/1.mp4" type="video/mp4">
                        </video>
                        `
                            : ""
                        }
                        ${
                          item.media_url && item.media_type === "CAROUSEL_ALBUM"
                            ? `
                            <div
                                class="postCarouselContainer"
                                carousel-children="${
                                  item.carouselChildren.length
                                }"
                            >
                                ${
                                  item.carouselChildren &&
                                  item.carouselChildren[0] &&
                                  item.carouselChildren[0].media_type ===
                                    "IMAGE"
                                    ? `
                                <div class="carouselChild">
                                    {% asset_img 1.jpg %}
                                </div>
                                `
                                    : ""
                                }
                                ${
                                  item.carouselChildren &&
                                  item.carouselChildren[1] &&
                                  item.carouselChildren[1].media_type ===
                                    "IMAGE"
                                    ? `
                                <div class="carouselChild">
                                    {% asset_img 2.jpg %}
                                </div>
                                `
                                    : ""
                                }
                                ${
                                  item.carouselChildren &&
                                  item.carouselChildren[2] &&
                                  item.carouselChildren[2].media_type ===
                                    "IMAGE"
                                    ? `
                                <div class="carouselChild">
                                    {% asset_img 3.jpg %}
                                </div>
                                `
                                    : ""
                                }
                                ${
                                  item.carouselChildren &&
                                  item.carouselChildren[3] &&
                                  item.carouselChildren[3].media_type ===
                                    "IMAGE"
                                    ? `
                                <div class="carouselChild">
                                    {% asset_img 4.jpg %}
                                </div>
                                `
                                    : ""
                                }
                                ${
                                  item.carouselChildren &&
                                  item.carouselChildren[4] &&
                                  item.carouselChildren[4].media_type ===
                                    "IMAGE"
                                    ? `
                                <div class="carouselChild">
                                    {% asset_img 5.jpg %}
                                </div>
                                `
                                    : ""
                                }
                                ${
                                  item.carouselChildren &&
                                  item.carouselChildren[5] &&
                                  item.carouselChildren[5].media_type ===
                                    "IMAGE"
                                    ? `
                                <div class="carouselChild">
                                    {% asset_img 6.jpg %}
                                </div>
                                `
                                    : ""
                                }
                                ${
                                  item.carouselChildren &&
                                  item.carouselChildren[6] &&
                                  item.carouselChildren[6].media_type ===
                                    "IMAGE"
                                    ? `
                                <div class="carouselChild">
                                    {% asset_img 7.jpg %}
                                </div>
                                `
                                    : ""
                                }
                                ${
                                  item.carouselChildren &&
                                  item.carouselChildren[7] &&
                                  item.carouselChildren[7].media_type ===
                                    "IMAGE"
                                    ? `
                                <div class="carouselChild">
                                    {% asset_img 8.jpg %}
                                </div>
                                `
                                    : ""
                                }
                                ${
                                  item.carouselChildren &&
                                  item.carouselChildren[8] &&
                                  item.carouselChildren[8].media_type ===
                                    "IMAGE"
                                    ? `
                                <div class="carouselChild">
                                    {% asset_img 9.jpg %}
                                </div>
                                `
                                    : ""
                                }
                                ${
                                  item.carouselChildren &&
                                  item.carouselChildren[9] &&
                                  item.carouselChildren[9].media_type ===
                                    "IMAGE"
                                    ? `
                                <div class="carouselChild">
                                    {% asset_img 10.jpg %}
                                </div>
                                `
                                    : ""
                                }
                            </div>
                        `
                            : ""
                        }
        
                        ${newCaption}
        
                        <div class="automaticGeneratedPostDescription">
                            Detta inlägg genereras automatiskt via vårt Instagram-flöde. För att se original-inlägget klicka <a target="_blank" href="${
                              item.permalink
                            }">här</a>
                        </div>
                        <br>
                        `;

            markdownContent = markdownContent.replaceAll(/( ){4,4}/g, ""); // Remove space-tabs

            try {
              fs.writeFileSync(markdownPath, markdownContent);

              newHexoPostsWereAdded = true;
            } catch (err) {
              log("ERROR: Error when trying to write to markdown files");
              log(JSON.stringify(err, null, 4));
              console.error(err);
              mailer.sendErrorLogMail(
                "Något gick fel när scriptet försökte pusha till git och deploya hemsidan",
                JSON.stringify(err, null, 4)
              );
            }
          } else {
            console.warn("Hexo-post already exists for this IG-post");
            log("WARN: Hexo post already exists for post path " + markdownPath);
          }
          await delay(1000);
        }
      }
      // Loop complete
      if (newHexoPostsWereAdded) {
        //await pushAndDeploy();
        log("SUCCESS! Updated the site automatically");
      } else {
        log("Nothing new was added");
      }
    } catch (err) {
      log("ERROR: Something went wrong when trying to update site");
      log(JSON.stringify(err, null, 4));
      console.error(err);
      mailer.sendErrorLogMail("Unknown error", JSON.stringify(err, null, 4));
    }
  } else {
    log("ERROR: Could not fetch feed of IG account");
    console.error("Could not fetch IG flow");
    mailer.sendErrorLogMail("Could not fetch feed of IG account", "");
  }
};

run();
