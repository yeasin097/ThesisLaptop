#!/bin/bash


export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/


# CHAINCODE_NAME="ehr"
CHAINCODE_NAME=$1
CHAINCODE_VERSION="1.0"
# CHAINCODE_PATH="../asset-transfer-basic/chaincodet-thesis/ChaincodeEHR"
CHAINCODE_PATH=$2
CHAINCODE_LABEL="${CHAINCODE_NAME}_${CHAINCODE_VERSION}"
CHAINCODE_TAR="${CHAINCODE_NAME}.tar.gz"

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

echo "Packaging chaincode..."
peer lifecycle chaincode package $CHAINCODE_TAR --path $CHAINCODE_PATH --lang node --label $CHAINCODE_LABEL

# Install the chaincode
peer lifecycle chaincode queryinstalled

echo "Installing chaincode..."
peer lifecycle chaincode install $CHAINCODE_TAR
peer lifecycle chaincode queryinstalled


# Query installed chaincodes and extract the package_id
echo "Querying installed chaincodes..."
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep -oP "(?<=Package ID: ).*(?=, Label: $CHAINCODE_LABEL)")

if [ -z "$PACKAGE_ID" ]; then
  echo "Error: Unable to extract package ID. Check the queryinstalled output."
  exit 1
fi

echo "Extracted Package ID: $PACKAGE_ID"





echo "Approving chaincode for Org1..."
peer lifecycle chaincode approveformyorg --orderer localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --sequence 1 \
  --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  --package-id $PACKAGE_ID

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:8051

peer lifecycle chaincode queryinstalled

peer lifecycle chaincode install $CHAINCODE_TAR

peer lifecycle chaincode queryinstalled
