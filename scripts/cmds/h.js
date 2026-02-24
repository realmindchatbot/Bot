const axios = require("axios");

module.exports = {
  config: {
    name: "hadith",
    // Aliases updated as requested
    aliases: ["hadis", "sahih", "hadees", "islamic"],
    version: "4.0",
    author: "Saim",
    countDown: 5,
    role: 0,
    shortDescription: "Daily Hadith",
    longDescription: "Fetch authentic Hadith with Arabic and translation.",
    category: "Islamic",
    guide: "{pn} or {pn} <number>"
  },

  onStart: async function ({ message, args }) {
    const hadithSource = "https://raw.githubusercontent.com/asgptbyadnan-cloud/Washiq-chat-bot/refs/heads/main/hadith.json";

    try {
      // 1. Loading Message with aesthetic vibe
      const loadingMsg = await message.reply("⏳ 𝐅𝐞𝐭𝐜𝐡𝐢𝐧𝐠 𝐃𝐢𝐯𝐢𝐧𝐞 𝐖𝐨𝐫𝐝𝐬...");

      const response = await axios.get(hadithSource);
      const hadithList = response.data;
      
      // Remove loading message
      await message.unsend(loadingMsg.messageID);

      let h;
      let totalHadith = hadithList.length;
      let selectionType = "Daily Pick";

      // 2. Selection Logic
      if (args[0] && !isNaN(args[0])) {
        let num = parseInt(args[0]);
        if (num < 1 || num > totalHadith) {
          return message.reply(`⚠️ 𝐎𝐮𝐭 𝐨𝐟 𝐑𝐚𝐧𝐠𝐞!\nAvailable Hadiths: 1 to ${totalHadith}`);
        }
        h = hadithList[num - 1];
        selectionType = `Selection #${h.id}`;
      } else {
        let random = Math.floor(Math.random() * totalHadith);
        h = hadithList[random];
      }

      // 3. Current Date
      const date = new Date().toLocaleDateString("en-US", {
        weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
      });

      // 4. Aesthetic Design Elements
      const line = "━━━━━━━━━━━━━━━━━━";
      
      // 5. Final Output Structure
      let output = `🌸 𝐀𝐥 𝐇𝐚𝐝𝐢𝐭𝐡 🌸❤️‍🩹\n` +
                   `${line}\n` +
                   `📅 ${date}\n` +
                   `📂 ${selectionType}\n` +
                   `${line}\n\n` +
                   
                   `🕌 𝐀𝐫𝐚𝐛𝐢𝐜:\n` +
                   `${h.arabic}\n\n` +
                   
                   `📖 𝐓𝐫𝐚𝐧𝐬𝐥𝐚𝐭𝐢𝐨𝐧:\n` +
                   `${h.bangla}\n\n` +
                   
                   `${line}\n` +
                   `📚 𝐒𝐨𝐮𝐫𝐜𝐞: ${h.reference}\n` +
                   `🔢 𝐈𝐧𝐝𝐞𝐱: ${h.id} of ${totalHadith}\n` +
                   `${line}\n` +
                   `💡 𝐓𝐲𝐩𝐞 '/hadis <number>' to read more.`;

      return message.reply(output);

    } catch (error) {
      console.error(error);
      return message.reply("🥀 𝐄𝐫𝐫𝐨𝐫: Unable to fetch Hadith right now.");
    }
  }
};
