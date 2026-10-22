from PIL import Image, ImageDraw

im = Image.open('scratch/butter_tiger_filtered.png').convert('RGBA')
width, height = im.size
pixels = im.load()

# Clear anything above y < 140 in the saddle area
for y in range(0, 142):
    for x in range(120, 360):
        pixels[x, y] = (0, 0, 0, 0)

# Clear specks near ears
for y in range(0, 160):
    for x in range(300, 390):
        # Ear is at x in [342, 385], y in [145, 195]
        if 342 <= x <= 390 and 145 <= y <= 195:
            r, g, b, a = pixels[x, y]
            if r > 230 and g > 160:
                continue
        pixels[x, y] = (0, 0, 0, 0)

draw = ImageDraw.Draw(im)

YELLOW = (254, 186, 32, 255)
BROWN = (175, 88, 5, 255)
OUTLINE = (18, 14, 12, 255)

# Backline curve:
# starts at x=115, y=142
# x=160, y=140
# x=210, y=143
# x=260, y=148
# x=310, y=156
# x=345, y=164

# Fill the saddle polygon:
saddle = [
    (115, 142),
    (160, 140),
    (210, 143),
    (260, 148),
    (310, 156),
    (345, 164),
    (345, 200),
    (115, 200)
]
draw.polygon(saddle, fill=YELLOW)

# Draw the 3 stripes:
# Stripe 1: x in [174..194], slopes from y=200 up to y=140
draw.polygon([(178, 200), (196, 200), (192, 141), (175, 141)], fill=BROWN)

# Stripe 2: x in [215..235], slopes up to y=144
draw.polygon([(216, 200), (234, 200), (231, 144), (214, 143)], fill=BROWN)

# Stripe 3: x in [256..276], slopes up to y=149
draw.polygon([(256, 200), (275, 200), (271, 149), (253, 148)], fill=BROWN)

# Outline along back:
back_line = [
    (114, 142),
    (160, 140),
    (210, 143),
    (260, 148),
    (310, 156),
    (345, 164)
]
draw.line(back_line, fill=OUTLINE, width=4)

# Trim transparent bounds
bbox = im.getbbox()
cropped = im.crop(bbox)
cropped.save('scratch/butter_tiger_seamless.png')
print("Saved seamless:", cropped.size)
