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
          let closestTimes = {
            A43N: Number.MAX_SAFE_INTEGER,
            G35N: Number.MAX_SAFE_INTEGER,
          }
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
                  const arrivalTimeUnix = stopTimeUpdate.arrival.time
                  if (arrivalTimeUnix < closestTimes[stopTimeUpdate.stopId]) {
                    closestTimes[stopTimeUpdate.stopId] = arrivalTimeUnix
                  }
                }
              })
            }
          })

          const currentTimeUnix = Math.floor(Date.now() / 1000)
          const nextArrivalA43N = Math.round(
            (closestTimes['A43N'] - currentTimeUnix) / 60
          )
          const nextArrivalG35N = Math.round(
            (closestTimes['G35N'] - currentTimeUnix) / 60
          )

          console.log(`Next train at A43N in: ${nextArrivalA43N} minutes`)
          console.log(`Next train at G35N in: ${nextArrivalG35N} minutes`)
        })
      }
    )
    .on('error', (err) => {
      console.log('Error: ' + err.message)
    })
})
