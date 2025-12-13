#!/usr/bin/env python3
import subprocess
import sys

def run_init():
    try:
        result = subprocess.run([
            sys.executable, '-m', 'jaclang', 'run', 'main.jac', '-w', 'init'
        ], capture_output=True, text=True, cwd='.')
        
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        print("Return code:", result.returncode)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_init()