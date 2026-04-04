# Lab 3: File I/O and Error Handling

## Objectives
- Read and write files in Python
- Handle exceptions gracefully
- Work with CSV and JSON files

## Exercises

### Exercise 3.1: Reading Files
Write a program that reads a text file and counts the frequency of each word. Print the top 10 most common words.

### Exercise 3.2: Writing Files
Create a program that generates a report from a list of student records and writes it to a formatted text file.

### Exercise 3.3: Error Handling
Modify your file reading program to handle:
- File not found errors
- Permission errors
- Empty files
Use `try/except/finally` blocks.

### Exercise 3.4: CSV and JSON
- Read a CSV file using the `csv` module
- Parse a JSON file using the `json` module
- Convert CSV data to JSON format

## Tips
- Always use `with open(...)` context manager
- Catch specific exceptions, not bare `except:`
- Use `logging` instead of `print()` for debugging
