# CoWin Vaccination Slot Availability Checker Bot
A basic telegram bot that checks CoWin vaccination slot periodically

**Description**

This app was developed for my personal use, it is running on a Raspberry Pi 3 at my home currently. This is a very basic telegram notification bot that runs every minute for checking CoWin Vaccination slot availability. This app uses the official CoWin APIs to fetch data. The bot will check for slots in the districts given in the config. CoWin has some kind of IP blocking, was unable to run this on a cloud VM at the time of writing this documentation.

If you are Thiruvananthapuram, Kerala, you can join this Telegram channel, this is where I'm getting my notifications now: https://t.me/tvmcowinavailability


**How To Get Your District ID & Configure This App**

You'll need the following configuration items for this to work:
1. District ID you want to search slots for
2. A telegram channel id
3. A telegram bot added to the above channel, we need the bot token to be exact

Follow the below steps to configure the app:

1. Clone this repo
2. Get your state id from the config file: https://github.com/vsaravind007/cowin-slot-availability-checker/blob/d3968791b076d2e284679fb77520a6baa97037f4/config.js#L21
3. Run `curl https://cdn-api.co-vin.in/api/v2/admin/location/districts/<YOUR_STATE_ID_HERE>`. For example `curl https://cdn-api.co-vin.in/api/v2/admin/location/districts/17`
4. The response to above curl will have your district IDs, identify the id of district(s) you want to monitor
5. Update your district ID here: https://github.com/vsaravind007/cowin-slot-availability-checker/blob/d3968791b076d2e284679fb77520a6baa97037f4/config.js#L5
6. Create a Telegram channel & update the channel id here: https://github.com/vsaravind007/cowin-slot-availability-checker/blob/d3968791b076d2e284679fb77520a6baa97037f4/config.js#L8
7. Create a Telegram bot & add it to your channel, follow this guide: https://www.logaster.com/blog/how-create-telegram-channel/
8. Once you've adedded the the bot to your channel, update your bot API token here: https://github.com/vsaravind007/cowin-slot-availability-checker/blob/d3968791b076d2e284679fb77520a6baa97037f4/config.js#L17
9. Run `npm install within the directory`
10. Run the app by `node index.js`

**Application Flow**

![Alt text](https://github.com/vsaravind007/cowin-slot-availability-checker/blob/main/images/flow.png?raw=true "Optional Title")
