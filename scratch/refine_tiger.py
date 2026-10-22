from PIL import Image, ImageDraw

im = Image.open('scratch/butter_tiger_filtered.png').convert('RGBA')
width, height = im.size
pixels = im.load()

# 1. Clear any leftover pixels above y < 140 in the center region (specks of flower/hair)
for y in range(0, 145):
    for x in range(120, 360):
        pixels[x, y] = (0, 0, 0, 0)

# Clear spear specks near ear (x in [300, 370], y in [100, 145])
for y in range(90, 140):
    for x in range(300, 380):
        # Don't clear Butter Tiger's ear (which is at x>345, y>130)
        if x > 340 and y > 135:
            continue
        pixels[x, y] = (0, 0, 0, 0)

draw = ImageDraw.Draw(im)

YELLOW = (254, 186, 32, 255)
BROWN = (183, 85, 14, 255)
OUTLINE = (18, 14, 12, 255)

# Back curve points:
# (128, 150) -> (170, 142) -> (220, 138) -> (270, 142) -> (315, 155) -> (335, 160)
# Fill the cutout polygon:
back_poly = [
    (130, 150),
    (165, 142),
    (210, 137),
    (260, 138),
    (300, 148),
    (335, 158),
    (335, 190),
    (170, 190),
    (130, 150)
]
draw.polygon(back_poly, fill=YELLOW)

# Draw the 3 brown tiger stripes extending up to the backline:
# Stripe 1: x from 170 to 184
draw.polygon([(170, 185), (184, 185), (182, 145), (170, 145)], fill=BROWN)
# Stripe 2: x from 225 to 242
draw.polygon([(225, 185), (242, 185), (239, 140), (225, 140)], fill=BROWN)
# Stripe 3: x from 272 to 289
draw.polygon([(272, 185), (289, 185), (286, 144), (272, 144)], fill=BROWN)

# Draw outline along the back curve:
back_line = [
    (125, 152),
    (165, 142),
    (210, 137),
    (260, 138),
    (300, 148),
    (335, 158)
]
draw.line(back_line, fill=OUTLINE, width=4)

# Trim transparent edges to make a tight bounding box
bbox = im.getbbox()
cropped = im.crop(bbox)
cropped.save('scratch/butter_tiger_perfect.png')
print("Saved perfect:", cropped.size)
