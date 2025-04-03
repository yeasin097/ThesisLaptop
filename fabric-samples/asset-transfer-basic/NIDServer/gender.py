import json
import random
import argparse

def add_gender_to_records(input_file, output_file):
    """
    Add a random gender field to each record in a JSON file.
    
    Args:
        input_file (str): Path to the input JSON file
        output_file (str): Path to save the output JSON file
    """
    # Define possible gender values
    genders = ["Male", "Female"]
    
    try:
        # Load the JSON data from the input file
        with open(input_file, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        # Check if the data is a list of records
        if not isinstance(data, list):
            print("Error: The JSON file should contain a list of records.")
            return
        
        # Add gender to each record
        for record in data:
           
            record["gender"] = random.choice(genders)
        
        # Save the updated data to the output file
        with open(output_file, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        
        print(f"Successfully added gender to {len(data)} records.")
        print(f"Updated data saved to {output_file}")
    
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found.")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in file '{input_file}'.")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    # Set up command line arguments
    parser = argparse.ArgumentParser(description="Add random gender to JSON records")
    parser.add_argument("input_file", help="Path to the input JSON file")
    parser.add_argument("--output", "-o", default="output.json", help="Path to save the output JSON file (default: output.json)")
    
    args = parser.parse_args()
    
    # Run the function
    add_gender_to_records(args.input_file, args.output)