from PIL import Image

im = Image.open('uploads/tigerlilyidletrans.gif')
print('Frames:', im.n_frames)
for i in range(0, min(5, im.n_frames)):
    im.seek(i)
    print(f'Frame {i}: duration={im.info.get("duration", 0)}, size={im.size}')
