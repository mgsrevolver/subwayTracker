// Require the necessary libraries. You should already have these installed.
const https = require('https')
const GtfsRealtimeBindings = require('gtfs-realtime-bindings')

// This object represents the different stations we want to monitor and their respective API endpoints.
const stations = {
  A43N: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace',
  G35N: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',
  G35S: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',
}

// Prepare our base arrays and objects which we'll later fill up with data.
let urls = []
let dtoMap = {}

// Fill the urls array with unique urls(target API endpoints) and map the stations to each URL.
for (let [key, value] of Object.entries(stations)) {
  if (!urls.includes(value)) urls.push(value)
  if (!dtoMap[value]) dtoMap[value] = [key]
  else dtoMap[value].push(key)
}

// Loop over each unique url(URL here is the target API endpoint)
urls.forEach((url) => {
  // Make an HTTP GET request to the target API endpoint
  https
    .get(
      url,
      { headers: { 'x-api-key': 'M5j6czyRVx61rmkdH8qyK936Xl5GdFrB4IiUbfGQ' } },
      (resp) => {
        let data = []
        // When we receive data, we'll want to accumulate it in our `data` variable
        resp.on('data', (chunk) => {
          data.push(chunk)
        })
        // Once we have all our data, we'll want to start processing it
        resp.on('end', () => {
          let buffer = Buffer.concat(data)
          let feed =
            GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer)

          // Prepare an object to store all our arrival times, initially empty
          let arrivalTimes = {}
          // Fill the arrivalTimes object with our target stations for this specific URL.
          dtoMap[url].forEach((station) => {
            arrivalTimes[station] = []
          })

          // Go through each 'entity' in the feed
          feed.entity.forEach(function (entity, index) {
            if (entity.tripUpdate) {
              // Inside each tripUpdate, look at each `stopTimeUpdate`
              entity.tripUpdate.stopTimeUpdate.forEach(function (
                stopTimeUpdate,
                index
              ) {
                // When a stopTimeUpdate matches one of our stations, save the time
                if (
                  stopTimeUpdate.arrival &&
                  dtoMap[url].includes(stopTimeUpdate.stopId)
                ) {
                  const arrivalTimeUnix = stopTimeUpdate.arrival.time
                  arrivalTimes[stopTimeUpdate.stopId].push(arrivalTimeUnix)
                }
              })
            }
          })

          // Current time in Unix time
          const currentTimeUnix = Math.floor(Date.now() / 1000)
          // Function to convert from Unix time to minutes
          const toMinutes = (time) => Math.round((time - currentTimeUnix) / 60)

          // Loop over each station's arrival times
          for (let [key, value] of Object.entries(arrivalTimes)) {
            // Filter out any times that are zero or less and sort them
            let nextArrivals = value
              .map(toMinutes)
              .filter((time) => time > 0)
              .sort((a, b) => a - b)
              .slice(0, 2)
            // If there's at least one arrival time, print it to console.
            if (nextArrivals.length > 0) {
              const direction =
                key.slice(3) === 'N' ? 'Northbound' : 'Southbound'
              console.log(
                `Next ${direction} ${key[0]} trains in: ${nextArrivals.join(
                  ', '
                )} minutes`
              )
            }
          }
        })
      }
    )
    // If any error occurs during our GET request, print the error to the console
    .on('error', (err) => {
      console.log('Error: ' + err.message)
    })
})
