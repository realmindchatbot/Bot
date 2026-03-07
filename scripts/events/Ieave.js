const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "leave",
		version: "1.7",
		author: "NTKhang / SaAd",
		category: "events"
	},

	onStart: async ({ threadsData, message, event, api, usersData }) => {
		if (event.logMessageType == "log:unsubscribe") {
			return async function () {
				const { threadID } = event;
				const threadData = await threadsData.get(threadID);

				if (threadData.settings.sendLeaveMessage == false) return;

				const { leftParticipantFbId, author } = event.logMessageData;
				if (leftParticipantFbId == api.getCurrentUserID()) return;

				try {
					const userName = await usersData.getName(leftParticipantFbId) || "কেউ একজন";
					let msgBody = "";
					let videoUrl = "";

					// কিক মারা হয়েছে নাকি নিজে লিভ নিয়েছে তা চেক করা
					if (leftParticipantFbId == author) {
						// ১. নিজে লিভ নিলে (Self Left)
						msgBody = `কি মজা ${userName} এক নালায়েক লিভ নিছে কি মজা  🐸👋`;
						videoUrl = "https://i.imgur.com/A8YI7Ql.mp4"; // এখানে লিভ নেওয়ার ভিডিও লিঙ্ক দিন
					} else {
						// ২. কিক মারা হলে (Kicked Out)
						const authorName = await usersData.getName(author) || "এডমিন";
						msgBody = `আহারে ${userName}! ${authorName} এর লাথি খেয়ে গ্রুপ থেকে বের হয়ে গেল! 😂🔥`;
						videoUrl = "https://i.imgur.com/N9DqTm3.mp4"; // এখানে কিক মারার ভিডিও লিঙ্ক দিন
					}

					const cacheDir = path.join(__dirname, "cache");
					if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
					const videoPath = path.join(cacheDir, `leave_${Date.now()}.mp4`);

					const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
					fs.writeFileSync(videoPath, Buffer.from(response.data));

					await message.send({
						body: msgBody,
						attachment: fs.createReadStream(videoPath)
					});

					setTimeout(() => {
						if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
					}, 8000);

				} catch (err) {
					console.error("Leave/Kick Event Error:", err);
					message.send(`গ্রুপ থেকে কেউ একজন বিদায় নিয়েছে, কিন্তু ভিডিও লোড করা গেল না।`);
				}
			};
		}
	}
};
