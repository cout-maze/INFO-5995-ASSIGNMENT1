# POC Videos

Video files are expected at:

- `pocs/videos/session-token-poc.mp4`
- `pocs/videos/credentials-poc.mp4`

This environment cannot capture GUI video directly, so record locally using one of the workflows below.

## Option A: OBS (recommended)

1. Open `pocs/session-token-emulator/index.html` in a browser.
2. Start a 1920x1080 recording in OBS.
3. Demo steps:
   - Click `Run Emulator`.
   - Highlight recovered seed + predicted token.
4. Stop recording and save as `pocs/videos/session-token-poc.mp4`.
5. Repeat for `pocs/credentials-emulator/index.html` and save as `pocs/videos/credentials-poc.mp4`.

## Option B: ffmpeg (X11)

```bash
# Update DISPLAY if needed (typically :0)
ffmpeg -y -f x11grab -video_size 1920x1080 -i :0.0 \
  -r 30 -vcodec libx264 -preset veryfast -crf 23 \
  pocs/videos/session-token-poc.mp4
```

Repeat for the credentials emulator. Stop with `q` when finished.
