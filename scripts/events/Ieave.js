const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "leave",
        version: "2.3",
        author: "Gemini",
        category: "events"
    },

    onStart: async ({ threadsData, message, event, api, usersData }) => {
        if (event.logMessageType == "log:unsubscribe") {
            return async function () {
                const { threadID } = event;
                const { leftParticipantFbId, author } = event.logMessageData;

                // যদি বট নিজে লিভ নেয় বা কিক খায়, তবে কিছু করবে না
                if (leftParticipantFbId == api.getCurrentUserID()) return;

                const threadData = await threadsData.get(threadID);
                if (threadData.settings && threadData.settings.sendLeaveMessage == false) return;

                try {
                    const userName = await usersData.getName(leftParticipantFbId) || "User";
                    let msgBody = "";
                    let videoUrl = "";

                    // লজিক চেক: যদি লিভ নেওয়া ব্যক্তি এবং ইভেন্ট ঘটানো ব্যক্তি ভিন্ন হয়, তবে এটি কিক
                    if (String(leftParticipantFbId) !== String(author)) {
                        // কিক মারা হয়েছে (Kicked)
                        msgBody = `${userName} জা শালা আবাল 🙄🦵🏻`;
                        videoUrl = "https://files.catbox.moe/enjbh3.mp4"; // কিক ভিডিও
                    } else {
                        // নিজে লিভ নিয়েছে (Self Left)
                        msgBody = `${userName} এই নালায়েক লিভ নিছে কি মজা 🐸👋`;
                        videoUrl = "https://files.catbox.moe/iscfll.mp4"; // লিভ ভিডিও
                    }

                    const cacheDir = path.join(__dirname, "cache");
                    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
                    const videoPath = path.join(cacheDir, `leave_${Date.now()}.mp4`);

                    const response = await axios({
                        method: 'get',
                        url: videoUrl,
                        responseType: 'stream'
                    });

                    const writer = fs.createWriteStream(videoPath);
                    response.data.pipe(writer);

                    writer.on('finish', async () => {
                        await message.send({
                            body: msgBody,
                            attachment: fs.createReadStream(videoPath)
                        });
                        setTimeout(() => { if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath); }, 10000);
                    });

                } catch (err) {
                    console.error("Error in leave event:", err);
                }
            };
        }
    }
};
