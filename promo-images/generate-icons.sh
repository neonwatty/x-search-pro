#!/bin/bash

# Script to generate PNG icons from SVG logo
# Requires Chrome/Chromium to be installed

echo "Generating PNG icons from SVG logo..."

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
    echo "Error: Chrome/Chromium not found."
    echo "Please install Chrome or use an online SVG to PNG converter."
    exit 1
fi

# Create temporary HTML files for each size
create_html() {
    local size=$1
    cat > "temp-icon-${size}.html" <<EOF
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; }
        body { width: ${size}px; height: ${size}px; overflow: hidden; }
        img { width: ${size}px; height: ${size}px; }
    </style>
</head>
<body>
    <img src="logos/x-search-pro-logo.svg" />
</body>
</html>
EOF
}

# Generate each icon size
for size in 16 32 48 128; do
    echo "Generating ${size}x${size} icon..."
    create_html $size
    "$CHROME" --headless --screenshot="assets/icons/icon${size}.png" --window-size=${size},${size} --default-background-color=0 "file://$(pwd)/temp-icon-${size}.html" 2>/dev/null
    rm "temp-icon-${size}.html"
done

echo "Done! Icons generated:"
echo "  - assets/icons/icon16.png"
echo "  - assets/icons/icon32.png"
echo "  - assets/icons/icon48.png"
echo "  - assets/icons/icon128.png"