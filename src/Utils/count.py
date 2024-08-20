def count_hex_values(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
    
    # Split the content by spaces
    hex_values = content.split()
    
    # Initialize counters
    zero_count = 0
    non_zero_count = 0
    
    # Iterate over the hex values and count zeros and non-zeros
    for value in hex_values:
        if value == '0x00':
            zero_count += 1
        else:
            non_zero_count += 1
    
    return zero_count, non_zero_count

# Example usage
file_path = 'imagedata.txt'
zero_count, non_zero_count = count_hex_values(file_path)
print(f"Zero count: {zero_count}")
print(f"Non-zero count: {non_zero_count}")
