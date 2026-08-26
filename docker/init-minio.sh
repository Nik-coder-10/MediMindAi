#!/bin/sh
# Initialize MinIO bucket for development
echo "Creating default MinIO bucket..."
/usr/bin/mc alias set myminio http://minio:9000 minioadmin minioadmin
/usr/bin/mc mb myminio/ayush-medical-records --ignore-existing
/usr/bin/mc anonymous set public myminio/ayush-medical-records
echo "MinIO initialization complete."
