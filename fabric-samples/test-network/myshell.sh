# !/bin/bash

start_time=$(date +%s)  # Record start time
echo "Script started at: $(date)"

./NetworkUpwith5peers.sh 

./acceptChaincode.sh doctor ../asset-transfer-basic/chaincodet-thesis/ChaincodeDoctor/
./acceptChaincode.sh patient ../asset-transfer-basic/chaincodet-thesis/ChaincodePatient/
./acceptChaincode.sh ehr ../asset-transfer-basic/chaincodet-thesis/ChaincodeEHR/
./acceptChaincode.sh research ../asset-transfer-basic/chaincodet-thesis/ChaincodeResearch/

./create_5_doctor.sh

total_time=$((end_time - start_time))
echo "Total execution time: $total_time seconds"