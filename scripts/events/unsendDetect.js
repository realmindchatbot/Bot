module.exports = {
  config: {
    name: "unsendDetect",
    version: "1.0",
    author: "nai 😔",
    description: "মেসেজ ডিলিট করলে শনাক্ত করবে"
  },

  onStart: async function ({ api, event, usersData }) {
    // চেক করা হচ্ছে মেসেজটি আনসেন্ড করা হয়েছে কি না
    if (event.type === "message_unsend") {
      const { threadID, senderID } = event;

      try {
        // মেসেজ যে ডিলিট করেছে তার নাম সংগ্রহ করা
        const userData = await usersData.get(senderID) || {};
        const name = userData.name || "কেউ একজন";

        // আপনার চাওয়া মেসেজ বডি
        const msg = `নিগ্গা ${name}, এই মেসেজটি ডিলিট করেছে। 🐸`;

        // রিপ্লাই হিসেবে পাঠানো
        return api.sendMessage(msg, threadID);
        
      } catch (error) {
        console.error("Unsend Detect Error:", error);
      }
    }
  }
};
