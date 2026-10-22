from PIL import Image, ImageDraw

# Open tiger_mounted_frame0
im = Image.open('scratch/tiger_mounted_frame0.png').convert('RGBA')

# In tiger_mounted_frame0, Tiger Lily is at:
# x: ~170 to ~340, y: 0 to ~180
# Butter Tiger's back curve is from (100, 140) to (340, 160)
# Let's inspect the colors of Butter Tiger's coat:
# Golden yellow coat: (254, 185, 40) or similar
# Brown stripes: (183, 85, 14) or similar
# White belly: (255, 255, 255)
# Dark outline: (18, 14, 12)

# Let's find out how Tiger Lily sits on Butter Tiger
print("Image size:", im.size)
