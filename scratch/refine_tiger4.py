from PIL import Image, ImageDraw

im = Image.open('scratch/butter_tiger_filtered.png').convert('RGBA')
width, height = im.size
pixels = im.load()

# Clear everything above the backline
for y in range(0, 140):
    for x in range(width):
        if x < 125 and y > 35:
            continue
        pixels[x, y] = (0, 0, 0, 0)

for y in range(0, 150):
    for x in range(300, width):
        pixels[x, y] = (0, 0, 0, 0)

draw = ImageDraw.Draw(im)

YELLOW = (254, 186, 32, 255)
BROWN = (175, 88, 5, 255)
OUTLINE = (18, 14, 12, 255)

# Smooth back polygon with rounded rump:
# The rump curve starts at (105, 165), curves up to (118, 144), (160, 140)...
saddle = [
    (105, 175),
    (108, 158),
    (118, 144),
    (160, 140),
    (210, 143),
    (260, 148),
    (310, 156),
    (345, 164),
    (345, 200),
    (105, 200)
]
draw.polygon(saddle, fill=YELLOW)

# 3 stripes:
draw.polygon([(178, 200), (196, 200), (192, 141), (175, 141)], fill=BROWN)
draw.polygon([(216, 200), (234, 200), (231, 144), (214, 143)], fill=BROWN)
draw.polygon([(256, 200), (275, 200), (271, 149), (253, 148)], fill=BROWN)

# Outline along back:
back_line = [
    (106, 170),
    (110, 155),
    (118, 144),
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
cropped.save('uploads/buttertiger.png')
print("Saved uploads/buttertiger.png:", cropped.size)
