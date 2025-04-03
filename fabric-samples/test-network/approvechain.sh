#!/bin/bash

# Check if correct number of arguments are provided
if [ "$#" -ne 2 ]; then
  echo "Usage: ./accept_chaincode <ChaincodeName> <FilePath>"
  exit 1
fi

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/

CHAINCODE_NAME=$1
CHAINCODE_PATH=$2
CHAINCODE_VERSION="1.0"
CHAINCODE_LABEL="${CHAINCODE_NAME}_${CHAINCODE_VERSION}"
CHAINCODE_TAR="${CHAINCODE_NAME}.tar.gz"

# Function to package and install chaincode
package_and_install_chaincode() {
  local CHAINCODE_NAME=$1
  local CHAINCODE_PATH=$2
  local CHAINCODE_TAR=$3
  local CHAINCODE_LABEL=$4
  
  echo "Packaging chaincode $CHAINCODE_NAME..."
  peer lifecycle chaincode package $CHAINCODE_TAR --path $CHAINCODE_PATH --lang node --label $CHAINCODE_LABEL
  
  echo "Installing chaincode $CHAINCODE_NAME..."
  peer lifecycle chaincode install $CHAINCODE_TAR
}

# Function to approve chaincode for an organization
approve_chaincode() {
  local CHAINCODE_NAME=$1
  local CHAINCODE_VERSION=$2
  local PACKAGE_ID=$3
  local ORG_MSP=$4
  local CORE_PEER_TLS_ROOTCERT_FILE=$5
  local CORE_PEER_MSPCONFIGPATH=$6
  local CORE_PEER_ADDRESS=$7
  local ORDERER_TLS_CAFILE=$8
  
  echo "Approving chaincode $CHAINCODE_NAME for $ORG_MSP..."
  peer lifecycle chaincode approveformyorg --orderer localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID mychannel \
    --name $CHAINCODE_NAME \
    --version $CHAINCODE_VERSION \
    --sequence 1 \
    --tls --cafile $ORDERER_TLS_CAFILE \
    --package-id $PACKAGE_ID
}

# Package and install chaincode
package_and_install_chaincode $CHAINCODE_NAME $CHAINCODE_PATH $CHAINCODE_TAR $CHAINCODE_LABEL

# Query installed chaincodes and extract the package_id
echo "Querying installed chaincodes..."
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep -oP "(?<=Package ID: ).*(?=, Label: $CHAINCODE_LABEL)")

if [ -z "$PACKAGE_ID" ]; then
  echo "Error: Unable to extract package ID. Check the queryinstalled output."
  exit 1
fi

echo "Extracted Package ID: $PACKAGE_ID"

# Save the package ID to a file for future use (optional)
echo $PACKAGE_ID > package_id.txt

# Approve the chaincode for Org1
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
approve_chaincode $CHAINCODE_NAME $CHAINCODE_VERSION $PACKAGE_ID "Org1MSP" ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Approve the chaincode for Org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
approve_chaincode $CHAINCODE_NAME $CHAINCODE_VERSION $PACKAGE_ID "Org2MSP" ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Approve the chaincode for Org3
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051
approve_chaincode $CHAINCODE_NAME $CHAINCODE_VERSION $PACKAGE_ID "Org3MSP" ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

echo "Chaincode approval completed for Org1, Org2, and Org3!"

# Commit the chaincode on the channel
peer lifecycle chaincode commit \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  --peerAddresses localhost:11051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt"

echo "Chaincode $CHAINCODE_NAME committed successfully!"


peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
-C mychannel -n $CHAINCODE_NAME \
--peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
--peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
--peerAddresses localhost:11051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt" \
-c '{"function":"InitLedger","Args":[]}'
