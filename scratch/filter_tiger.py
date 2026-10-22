from PIL import Image, ImageDraw

im = Image.open('scratch/tiger_mounted_frame0.png').convert('RGBA')
width, height = im.size

# Create a clean canvas
out = Image.new('RGBA', (width, height), (0, 0, 0, 0))

# Copy Butter Tiger pixels, excluding Tiger Lily
# Tiger Lily is strictly above Butter Tiger's backline:
# Butter Tiger's back runs roughly from (100, 105) through (200, 135), (280, 145) to (340, 150)
# Her spear is around x in [300, 420], y in [105, 160]

pixels = im.load()
out_pixels = out.load()

# Main body yellow: (254, 186, 32)
# Outline: (18, 14, 12)
# Stripe brown: (183, 85, 14)

for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        if a == 0:
            continue
        
        # Check if pixel belongs to Tiger Lily:
        # Teal hair: r < 50, g > 100, b > 100
        is_hair = (r < 60 and g > 110 and b > 110)
        # Orange flower / dress / spear:
        # flower orange: (230..255, 80..130, 20..60)
        # skin tone: (190..230, 120..155, 60..90)
        # green leaf: (20..50, 70..100, 30..60)
        
        # Tiger Lily is in the upper region: y < 195 and x in [130, 420]
        if y < 195 and 130 <= x <= 420:
            # Teal hair / dark green leaves
            if (r < 70 and g > 100 and b > 100) or (r < 60 and 60 < g < 110 and 20 < b < 70):
                continue
            # Flower / dress bright orange / spear tip:
            if (r > 200 and 60 < g < 150 and b < 80) and (y < 145 or (x > 300 and y < 170)):
                continue
            # Spear shaft & tip:
            if x > 300 and y < 165:
                # Butter Tiger's ear is at x=340..400, y=115..170, color is yellow (r>230, g>170, b<70)
                is_ear = (r > 230 and g > 165 and b < 80)
                is_stripe = (160 < r < 200 and 70 < g < 105 and b < 30)
                if not (is_ear or is_stripe):
                    continue
            # Tiger Lily's face / skin / headband / eyes
            if y < 145 and (r > 150 and g > 100 and b > 50):
                # Check if it's Butter Tiger's coat
                if not (r > 230 and g > 165 and b < 70):
                    continue
            # Tiger Lily's legs / sandals (around x: 200..300, y: 130..190)
            if y < 185 and 200 <= x <= 300:
                # Sandals are brown with white laces, dress is orange
                # Butter Tiger's back here is yellow or brown stripe
                if not (r > 230 and g > 165 and b < 70) and not (150 < r < 200 and 60 < g < 105 and b < 35):
                    continue
                    
        out_pixels[x, y] = (r, g, b, a)

out.save('scratch/butter_tiger_filtered.png')
print("Filtered saved")
