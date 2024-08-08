from PIL import Image
import io

# Load the image
image_path = 'image2.jpg'
image = Image.open(image_path)

# Convert the image to bytes
with io.BytesIO() as byte_io:
    image.save(byte_io, format='JPEG')
    byte_array = byte_io.getvalue()

# Convert byte array to formatted hexadecimal array string
hex_array = [f'0x{byte:02X}' for byte in byte_array]
hex_array_str = ', '.join(hex_array)
formatted_hex_array_str = f'const imageDataArray = [\n{hex_array_str}\n];'

# Save the formatted hexadecimal array to a text file
with open('image_bytes.txt', 'w') as file:
    file.write(formatted_hex_array_str)

print("Hexadecimal byte array saved to image_bytes.txt")
