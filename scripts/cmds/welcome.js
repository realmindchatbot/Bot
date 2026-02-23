module.exports = {
  config: {
    name: "welcome",
    aliases: ["wlcm", "swagoto"],
    version: "2.5",
    author: "nai 😔",
    countDown: 5,
    role: 0,
    shortDescription: "Reply or mention to welcome someone",
    category: "group",
    guide: "{pn} (Reply to a message) or {pn} @mention"
  },

  onStart: async function ({ api, event, threadsData, message }) {
    const { threadID, messageReply, mentions } = event;

    let targetID, targetName;

    try {
      // ১. যদি কারো মেসেজে রিপ্লাই দিয়ে কমান্ড দেওয়া হয়
      if (messageReply) {
        targetID = messageReply.senderID;
        const userInfo = await api.getUserInfo(targetID);
        targetName = userInfo[targetID].name;
      } 
      // ২. যদি কাউকে মেনশন করে কমান্ড দেওয়া হয়
      else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        targetName = mentions[targetID].replace('@', '');
      } 
      // ৩. যদি রিপ্লাই বা মেনশন কিছুই না থাকে
      else {
        return message.reply("⚠️ দয়া করে যাকে স্বাগতম জানাতে চান তার মেসেজে রিপ্লাই দিন অথবা তাকে মেনশন করুন।");
      }

      // গ্রুপের নাম সংগ্রহ করা
      const threadInfo = await threadsData.get(threadID) || {};
      const threadName = threadInfo.threadName || "আমাদের গ্রুপে";

      const msg = `আসসালামু আলাইকুম, ${targetName}!\n\nআমাদের "${threadName}" গ্রুপে আপনাকে স্বাগতম। 🌸\nআশা করি আমাদের সাথে আপনার সময়টা অনেক ভালো কাটবে।`;

      return api.sendMessage({
        body: msg,
        mentions: [{
          tag: targetName,
          id: targetID
        }]
      }, threadID);

    } catch (error) {
      console.error("Welcome Error:", error);
      return message.reply("❌ ব্যবহারকারীর তথ্য পাওয়া যায়নি। আবার চেষ্টা করুন।");
    }
  }
};
