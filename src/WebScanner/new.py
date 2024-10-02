def wav_to_hex(file_path, output_file):
    with open(file_path, 'rb') as wav_file:
        # Read the entire file as binary data
        byte_data = wav_file.read()
        
        # Convert each byte to hexadecimal
        hex_data = [f"0x{byte:02x}" for byte in byte_data]
        
        # Join into a string (optional, for better readability)
        hex_string = ' '.join(hex_data)
        
        # Write the hex data to the output file
        with open(output_file, 'w') as output:
            output.write(hex_string)

# Usage example
file_path = 'tone.wav'
output_file = 'output.data'
wav_to_hex(file_path, output_file)
