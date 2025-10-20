#!/bin/bash

echo "Testing SwoleExperience container..."

# Build the container
echo "Building container..."
docker build -t swole-experience-test .

if [ $? -eq 0 ]; then
    echo "Build successful!"
    
    # Run the container in the background
    echo "Starting container..."
    docker run -d -p 8080:80 --name swole-test swole-experience-test
    
    if [ $? -eq 0 ]; then
        echo "Container started successfully!"
        echo "Testing HTTP response..."
        
        # Wait a moment for nginx to start
        sleep 3
        
        # Test the HTTP response
        curl -I http://localhost:8080
        
        echo ""
        echo "Container logs:"
        docker logs swole-test
        
        echo ""
        echo "Cleaning up..."
        docker stop swole-test
        docker rm swole-test
    else
        echo "Failed to start container"
    fi
else
    echo "Build failed!"
fi
