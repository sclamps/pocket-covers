# Pocket Covers

Learn any drum cover, one part at a time. Drop in a drum cover video and Pocket Covers finds the beat and the sections, then lets you loop blocks, slow it down and play along with a metronome that follows the drummer.

Everything runs in the browser. Uploads are stored on the device you upload them on.

## Run it locally

Any static file server works, for example:

```
npx http-server -p 8080
```

Then open http://localhost:8080. The service worker and install prompt only work over HTTPS or on localhost.

## Deploying updates

Bump `VERSION` in `sw.js` whenever you change files, so installed copies pick up the update.

## Third party

`stretch.js` is Signalsmith Stretch (https://signalsmith-audio.co.uk/code/stretch/), MIT licensed, copyright Geraint Luff / Signalsmith Audio.
