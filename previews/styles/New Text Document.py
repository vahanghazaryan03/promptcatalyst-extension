import os

def compile_filenames(directory_path, output_file):
    """
    Compile all filenames from the specified directory into a text file.
    
    Args:
        directory_path (str): Path to the directory to scan
        output_file (str): Path to the output text file
    """
    try:
        # Get list of all files in directory
        with open(output_file, 'w', encoding='utf-8') as f:
            # Walk through directory and all subdirectories
            for root, dirs, files in os.walk(directory_path):
                # Write the current directory path
                relative_path = os.path.relpath(root, directory_path)
                if relative_path != '.':
                    f.write(f"\nDirectory: {relative_path}\n")
                else:
                    f.write("Root Directory Contents:\n")
                
                # Write all filenames in current directory
                for filename in sorted(files):
                    f.write(f"- {filename}\n")
                
        print(f"Successfully created file list in {output_file}")
        
    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage
if __name__ == "__main__":
    # Replace these paths with your desired directory and output file location
    directory_to_scan = "."  # Current directory
    output_filename = "file_list.txt"
    
    compile_filenames(directory_to_scan, output_filename)