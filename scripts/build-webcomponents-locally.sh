#!/bin/bash

# Function to check if an npm command was successful
run_command() {
  echo "Running: $1"
  npm run "$1"

  # Check if the command succeeded
  if [ $? -ne 0 ]; then
    echo "Command $1 failed. Exiting..."
    exit 1
  fi
}

# Sequential execution of npm commands
run_command "build:wc:evfform"
run_command "build:wc:pdf"
run_command "build:wc:evfdetails"
run_command "build:wc:create:no-deps"
run_command "build:wc:list"
run_command "build:wc:details:no-deps"

# afterwards run "serve --3000" # => to use the global serve package => install first if not installed yet
