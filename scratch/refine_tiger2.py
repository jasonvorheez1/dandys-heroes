from PIL import Image, ImageDraw

# Reload fresh filtered frame
im = Image.open('scratch/butter_tiger_filtered.png').convert('RGBA')
width, height = im.size
pixels = im.load()

# Clear specks above y < 145 across the board
for y in range(0, 145):
    for x in range(width):
        # Don't touch the tail on the left (x < 130)
        # Tail ends at x=125, y=55
        if x < 125 and y > 35:
            continue
        # Don't touch the ears on the right (x > 330, y > 135)
        if x > 330 and y > 130:
            continue
        pixels[x, y] = (0, 0, 0, 0)

# Clear extra specks near ears
for y in range(80, 135):
    for x in range(310, 400):
        pixels[x, y] = (0, 0, 0, 0)

draw = ImageDraw.Draw(im)

YELLOW = (254, 186, 32, 255)
BROWN = (183, 85, 14, 255)
OUTLINE = (18, 14, 12, 255)

# Smooth natural back curve
# Tail starts at (122, 108), back curves up to (180, 88), (240, 82), (300, 92), (340, 115)
back_poly = [
    (115, 125),
    (145, 102),
    (185, 90),
    (235, 84),
    (285, 90),
    (330, 108),
    (350, 135),
    (350, 185),
    (145, 185),
    (115, 125)
]
draw.polygon(back_poly, fill=YELLOW)

# 3 Brown stripes matching the existing lower stripes:
# Lower stripe 1 is at x=180..198, y=145..195
draw.polygon([(178, 185), (198, 185), (192, 90), (174, 92)], fill=BROWN)

# Lower stripe 2 is at x=228..248, y=145..195
draw.polygon([(228, 185), (248, 185), (242, 85), (224, 86)], fill=BROWN)

# Lower stripe 3 is at x=268..288, y=145..195
draw.polygon([(268, 185), (288, 185), (284, 90), (266, 91)], fill=BROWN)

# Outline along the smooth back:
back_line = [
    (115, 118),
    (145, 100),
    (185, 89),
    (235, 83),
    (285, 89),
    (330, 108),
    (348, 132)
]
draw.line(back_line, fill=OUTLINE, width=4)

# Trim transparent bounding box
bbox = im.getbbox()
cropped = im.crop(bbox)
cropped.save('scratch/butter_tiger_clean.png')
print("Saved clean:", cropped.size)
