# !/bin/bash
./NetworkUpwith5peers.sh 

./acceptChaincode.sh doctor ../asset-transfer-basic/chaincodet-thesis/ChaincodeDoctor/
./acceptChaincode.sh patient ../asset-transfer-basic/chaincodet-thesis/ChaincodePatient/
./acceptChaincode.sh ehr ../asset-transfer-basic/chaincodet-thesis/ChaincodeEHR/
./acceptChaincode.sh research ../asset-transfer-basic/chaincodet-thesis/ChaincodeResearch/

./create_5_doctor.sh

