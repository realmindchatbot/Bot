const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "cutiepie",
    aliases: ["cutiepie", "cute"], 
    version: "1.0",
    author: "SaAd / gemini", 
    countDown: 5,
    role: 0,
    usePrefix: true,
    shortDescription: "Turn a female user into a monkey!",
    category: "fun",
    guide: { en: "{pn} @mention or reply (or use without mention for random female)" },
  },

  onStart: async function ({ event, message, api, usersData }) {
    let targetID = event.type === "message_reply" ? event.messageReply.senderID : Object.keys(event.mentions)[0];

    if (!targetID) {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participantIDs = threadInfo.participantIDs;
      let femaleIDs = [];
      for (let id of participantIDs) {
        const uData = await usersData.get(id);
        if (uData.gender === 1 || String(uData.gender).toLowerCase() === "female") {
          femaleIDs.push(id);
        }
      }
      if (femaleIDs.length === 0) return message.reply("❗ There are no female members detected in this group! 🐒");
      targetID = femaleIDs[Math.floor(Math.random() * femaleIDs.length)];
    }

    try {
      const userData = await usersData.get(targetID);
      const targetName = userData.name || "Cute pie";

      if (userData.gender !== 1 && String(userData.gender).toLowerCase() !== "female") {
        return message.reply("❗ This command only works on female users! 🐒");
      }

      // এখানে টার্গেট নেম সরিয়ে দেওয়া হয়েছে
      const waitMsg = await message.reply(`⌛ Finding a Cute pie Grill 🎀🐍`);

      let avatarUrl;
      try { avatarUrl = await usersData.getAvatarUrl(targetID); } 
      catch (e) { avatarUrl = `https://graph.facebook.com/${targetID}/picture?type=large`; }

      let avatarRes;
      try { avatarRes = await axios.get(avatarUrl, { responseType: "arraybuffer" }); } 
      catch (e) { 
        const fallbackUrl = "https://i.ibb.co/X7P4C21/default-avatar.png"; 
        avatarRes = await axios.get(fallbackUrl, { responseType: "arraybuffer" }); 
      }

      const avatarImage = await loadImage(Buffer.from(avatarRes.data));
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      
      const bgResponse = await axios.get("https://files.catbox.moe/dbq6gh.jpg", { responseType: "arraybuffer" });
      const bgImage = await loadImage(Buffer.from(bgResponse.data));

      const canvas = createCanvas(bgImage.width, bgImage.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bgImage, 0, 0);

      const avatarSize = 180; 
      const headX = (bgImage.width / 2) - (avatarSize / 2); 
      const headY = 60;  

      ctx.save();
      ctx.beginPath();
      ctx.arc(headX + avatarSize/2, headY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImage, headX, headY, avatarSize, avatarSize);
      ctx.restore();

      const outputPath = path.join(cacheDir, `bandor_${targetID}_${Date.now()}.png`);
      await fs.writeFile(outputPath, canvas.toBuffer("image/png"));

      await message.reply({
        body: `Hey My Cutepie Sister 🎀🐣\n${targetName}`,
        mentions: [{ tag: targetName, id: targetID }],
        attachment: fs.createReadStream(outputPath),
      });

      if (waitMsg && waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
      setTimeout(() => { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath) }, 5000);

    } catch (err) {
      console.error(err);
      message.reply(`❌ Something went wrong.`);
    }
  },
};
      
