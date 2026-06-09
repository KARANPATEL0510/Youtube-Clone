# Converting MOV Videos to MP4

Your uploaded videos are in MOV format, which is not supported by most web browsers. Follow one of these methods to convert them:

## Option 1: Using Free Online Tools (Easiest)
1. Go to [CloudConvert](https://cloudconvert.com/mov-to-mp4) or [Online-Convert](https://image.online-convert.com/convert-to-mp4)
2. Upload your MOV file
3. Download the converted MP4 file
4. Upload the MP4 to this app

## Option 2: Using Windows built-in tools (No Installation)
1. Install **MediaInfo** - provides conversion info
2. Use [HandBrake](https://handbrake.fr/) - Free, user-friendly video converter
   - Download and install HandBrake
   - Open HandBrake → Select your MOV file
   - Choose format: MP4
   - Click Convert
   - Upload the result

## Option 3: Using Command Line (If you have ffmpeg installed)
```bash
# Install ffmpeg first (if not installed)
# Then run this command in your video folder:
ffmpeg -i input.mov -c:v libx264 -crf 23 -c:a aac output.mp4
```

## Why MOV Doesn't Work in Web Browsers
- MOV is Apple's QuickTime format
- Browsers only support: **MP4, WebM, Ogg, MPEG-TS**
- MP4 is the most compatible format for web

## Recommended Settings for Web Videos
When converting your MOV to MP4, use these settings for best results:
- **Codec**: H.264 (AVC)
- **Quality**: Bitrate 5000-8000 kbps (good quality)
- **Resolution**: 1920x1080 (Full HD) or 1280x720 (HD)
- **Frame Rate**: 24 or 30 fps

After conversion, delete the old MOV file and upload the new MP4 file!
