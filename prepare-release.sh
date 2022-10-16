# prepare-release.sh
#!/bin/bash
# This script prepares a release of the project.

# Check if version is specified
if [ -z "$1" ]; then
    echo "Usage: prepare-release.sh <version>"
    exit 1
fi

# Check if the script is run from the root of the project.
if [ ! -f "prepare-release.sh" ]; then
    echo "This script must be run from the root of the project."
    exit 1
fi

# Check if the script is run from the main branch.
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "This script must be run from the main branch."
    exit 1
fi

# Make sure the working directory is clean.
if [ -n "$(git status --porcelain)" ]; then
    echo "The working directory is dirty. Please commit any pending changes."
    exit 1
fi

# Check resources/db.json file is an empty object: {}.
if [ "$(cat resources/db.json)" != "{}" ]; then
    echo "The resources/db.json file is not empty. Please empty it."
    exit 1
fi 

# Clean install the project.
npm ci

# build the project
npm run build

# remove heaviest node_modules
rm -rf node_modules/typescript node_modules/@types mocha

# Make sure release directory is clean.
if [ -d "build/Release/$1" ]; then
    rm -rf build/Release/$1
fi

# Create a folder for the release
mkdir build/Release/$1

# Copy the package.json to the release folder
cp package.json build/Release/$1

# Copy the build files to the release folder
cp -R dist build/Release/$1

# Copy node_modules to the release folder
cp -R node_modules build/Release/$1

# Copy resources to the release folder
cp -R resources build/Release/$1

# Create a zip file for the release
rm -f build/Release/lowmq-$1.zip
cd build/Release
zip -rq lowmq-$1.zip $1


# Regenerate the node_modules folder
npm ci

# Print that the release is ready
echo "Release $1 is ready."