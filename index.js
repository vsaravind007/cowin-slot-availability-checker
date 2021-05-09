const async = require('async')
const request = require('request')
const _ = require('lodash')
const redis = require('redis')
const cron = require('node-cron')

// Run every minute
cron.schedule('* * * * *', () => {
  const DISTRICTS = require('./config').DISTRICTS
  const FETCH_DATA_API = require('./config').FETCH_DATA_API
  const ENABLED_DISTRICTS = require('./config').ENABLED_DISTRICTS
  const TELEGRAM_API = require('./config').TELEGRAM_API
  const TELEGRAM_CHANNEL = require('./config').TELEGRAM_CHANNEL

  const client = redis.createClient()

  client.on('error', function (error) {
    console.error('Redis Error', error)
  })

  function getFormattedCurrentDate (today) {
    let dd = String(today.getDate()).padStart(2, '0')
    let mm = String(today.getMonth() + 1).padStart(2, '0')
    let yyyy = today.getFullYear()
    return dd + '-' + mm + '-' + yyyy
  }

  async.each(DISTRICTS.districts, function (district, cb) {
    let _date = getFormattedCurrentDate(new Date())
    if (ENABLED_DISTRICTS.indexOf(district.district_id) < 0) { return cb(null) }

    async.waterfall([
      function getDataFromAPI (icb) {
        console.log(`Fetching data for ${district.district_name}`)
        request(FETCH_DATA_API(_date, district.district_id), function (err, response, body) {
          if (err) {
            console.log('Error while fetching data from API', err)
            return icb(err)
          }
          try {
            body = JSON.parse(body)
          } catch (e) {
            console.log('Error while parsing response', e)
          }
          return icb(null, body)
        })
      },

      function processAPIResponse (data, icb) {
        console.log(`Processing data for ${district.district_name}`)
        let notifications = {}
        async.eachSeries(data.centers, function (center, iicb) {
          notifications[center.center_id] = []
          async.each(center.sessions, function (session, iiicb) {
            if (session.available_capacity > 0) {
              notifications[center.center_id].push({
                date: session.date,
                availability: session.available_capacity,
                min_age_limit: session.min_age_limit,
                vaccine: session.vaccine,
                time_slots: session.slots,
                center_id: center.center_id,
                center_name: center.name,
                center_address: center.address,
                // Data from API is invalid at the time of writing this app
                gps: {
                  latitude: center.lat,
                  longitude: center.long
                },
                center_pincode: center.pincode,
                fee_type: center.fee_type,
                block_name: center.block_name
              })
            }
            return iiicb(null)
          }, iicb)
        }, function (err, done) {
          return icb(err, notifications)
        })
      },

      function generateNotification (data, icb) {
        let _noData = true
        Object.keys(data).map(function (key) {
          if (data[key].length > 0) { _noData = false }
        })

        if (_noData) { return icb(null, null) }

        let message = `⚠️ Vaccination Slot Available ⚠️`
        async.eachSeries(data, function (notification, iicb) {
          async.eachSeries(notification, function (session, iiicb) {
            message += `\n\n🏥 Center: ${session.center_name}\n📃 Address: ${session.center_address}\n📝 Minimum Age: ${session.min_age_limit}yrs\n💉 Vaccine: ${session.vaccine}\n🔢 Availability: ${session.availability}\n💰 Fees: ${session.fee_type}\n⏱️ Time: ${session.time_slots}`
            return iiicb(null)
          }, iicb)
        }, function (err, done) {
          return icb(null, message)
        })
      },

      function sendNotification (message, icb) {
        if (message === null) {
          console.log('No available slots')
          client.get('last_run_time', function (err, response) {
            console.log('Redis response', response)
            if (response == null) { message = `No slots available now, last checked ${new Date()}` }
            if (new Date().getTime() - parseInt(response) >= 3600000) {
              console.log('No available slots and the last notification was about 1hr ago')
              message = `No slots available now, last checked ${new Date(parseInt(response))}`
            }

            if (message === null) {
              console.log('No messages to send')
              return icb(null)
            }

            request(TELEGRAM_API(TELEGRAM_CHANNEL, encodeURI(message)), function (err, response, body) {
              console.log('Error while sending message to telegram', err)
              client.set('last_run_time', new Date().getTime(), function (err, response) {
                console.log('Response from Redis after writing last message time', response)
                return icb(err)
              })
            })
          })
        } else {
          request(TELEGRAM_API(TELEGRAM_CHANNEL, encodeURI(message)), function (err, response, body) {
            console.log(err)
            return icb(err)
          })
        }
      }

    ], function (err, done) {
      client.quit()
    })
  }, function (err) {
    console.log(getFormattedCurrentDate())
  })
})
