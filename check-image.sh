#!/bin/bash
echo "=== Image Diagnostics ==="
echo ""
echo "1. Checking if image file exists:"
if [ -f "images/Rehema.jpg" ]; then
    echo "   ✅ File exists: images/Rehema.jpg"
    ls -lh images/Rehema.jpg
else
    echo "   ❌ File NOT found: images/Rehema.jpg"
fi
echo ""

echo "2. Checking file permissions:"
ls -la images/Rehema.jpg
echo ""

echo "3. Checking HTML reference:"
grep -n "Rehema.jpg" index.html
echo ""

echo "4. File type:"
file images/Rehema.jpg
echo ""

echo "5. Image dimensions:"
identify images/Rehema.jpg 2>/dev/null || echo "   (ImageMagick not installed, skipping)"
echo ""

echo "=== Test Complete ==="
