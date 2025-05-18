import sys
from PIL import Image
import os

path = sys.argv[1]
name, ext = os.path.splitext(path)
if ext in [".jpg", ".jpeg", ".png"]:
    img = Image.open(path)
    img.save(name + "_cleaned" + ext)
    print("Image scrubbed.")
else:
    print("Unsupported file.")
