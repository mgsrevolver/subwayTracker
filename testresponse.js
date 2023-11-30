const https = require('https')
const GtfsRealtimeBindings = require('gtfs-realtime-bindings')

https
  .get(
    'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',
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
        feed.entity.forEach(function (entity) {
          if (entity.tripUpdate) {
            entity.tripUpdate.stopTimeUpdate.forEach(function (stopTimeUpdate) {
              if (
                stopTimeUpdate.stopId == 'G35' ||
                stopTimeUpdate.stopId == 'A43'
              ) {
                console.log(stopTimeUpdate)
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
