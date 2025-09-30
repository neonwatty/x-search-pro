#!/bin/bash

# Script to convert HTML promotional images to PNG
# Requires Chrome/Chromium to be installed

echo "Converting HTML promotional images to PNG..."

# Check if Chrome is available
if command -v google-chrome &> /dev/null; then
    CHROME="google-chrome"
elif command -v chromium &> /dev/null; then
    CHROME="chromium"
elif command -v chromium-browser &> /dev/null; then
    CHROME="chromium-browser"
elif [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
else
    echo "Error: Chrome/Chromium not found. Please install Chrome or use the online method."
    exit 1
fi

# Convert 440x280 image
echo "Converting promo-440x280.html..."
"$CHROME" --headless --screenshot=promo-440x280.png --window-size=440,280 --default-background-color=0 "file://$(pwd)/promo-440x280.html"

# Convert 1400x560 image
echo "Converting promo-1400x560.html..."
"$CHROME" --headless --screenshot=promo-1400x560.png --window-size=1400,560 --default-background-color=0 "file://$(pwd)/promo-1400x560.html"

echo "Done! Images saved as:"
echo "  - promo-440x280.png"
echo "  - promo-1400x560.png"