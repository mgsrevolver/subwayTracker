const https = require('https')
const GtfsRealtimeBindings = require('gtfs-realtime-bindings')

const urls = [
  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',
  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace',
]

urls.forEach((url) => {
  https
    .get(
      url,
      { headers: { 'x-api-key': 'M5j6czyRVx61rmkdH8qyK936Xl5GdFrB4IiUbfGQ' } },
      (resp) => {
        let data = []
        resp.on('data', (chunk) => {
          data.push(chunk)
        })
        resp.on('end', () => {
          let buffer = Buffer.concat(data)
          let feed =
            GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer)
          feed.entity.forEach(function (entity, index) {
            if (entity.tripUpdate) {
              entity.tripUpdate.stopTimeUpdate.forEach(function (
                stopTimeUpdate,
                index
              ) {
                if (
                  stopTimeUpdate.arrival &&
                  (stopTimeUpdate.stopId === 'A43N' ||
                    stopTimeUpdate.stopId === 'G35N')
                ) {
                  console.log(
                    `Entity ${index}, arrival time: ${new Date(
                      stopTimeUpdate.arrival.time * 1000
                    )}, stopId: ${stopTimeUpdate.stopId}`
                  )
                }
              })
            }
          })
        })
      }
    )
    .on('error', (err) => {
      console.log('Error: ' + err.message)
    })
})
