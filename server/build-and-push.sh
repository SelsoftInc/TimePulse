#!/bin/bash

# AWS ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 879381275427.dkr.ecr.us-east-1.amazonaws.com

# Build Docker image
docker build -t timepulse-backend .

# Tag image for ECR
docker tag timepulse-backend:latest 879381275427.dkr.ecr.us-east-1.amazonaws.com/timepulse-backend:latest

# Push to ECR
docker push 879381275427.dkr.ecr.us-east-1.amazonaws.com/timepulse-backend:latest

echo "Image pushed successfully!"
echo "ECR URI: 879381275427.dkr.ecr.us-east-1.amazonaws.com/timepulse-backend:latest"
