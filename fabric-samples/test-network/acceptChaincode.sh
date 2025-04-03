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
echo "Installing chaincode..."
peer lifecycle chaincode install $CHAINCODE_TAR

# Query installed chaincodes and extract the package_id
echo "Querying installed chaincodes..."
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep -oP "(?<=Package ID: ).*(?=, Label: $CHAINCODE_LABEL)")

if [ -z "$PACKAGE_ID" ]; then
  echo "Error: Unable to extract package ID. Check the queryinstalled output."
  exit 1
fi

echo "Extracted Package ID: $PACKAGE_ID"

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:8051
peer lifecycle chaincode install $CHAINCODE_TAR


# Approve the chaincode for Org1
echo "Approving chaincode for Org1..."
peer lifecycle chaincode approveformyorg --orderer localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --sequence 1 \
  --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  --package-id $PACKAGE_ID

echo "Chaincode approval for Org1 completed successfully!"


export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

echo "Installing chaincode..."
peer lifecycle chaincode install $CHAINCODE_TAR

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:10051

peer lifecycle chaincode install $CHAINCODE_TAR

echo "Approving chaincode for Org2..."
peer lifecycle chaincode approveformyorg --orderer localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --sequence 1 \
  --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  --package-id $PACKAGE_ID

echo "Chaincode approval for Org2 completed successfully!"


export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051

echo "Installing chaincode..."
peer lifecycle chaincode install $CHAINCODE_TAR

echo "Approving chaincode for Org3..."
peer lifecycle chaincode approveformyorg --orderer localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --sequence 1 \
  --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  --package-id $PACKAGE_ID

echo "Chaincode approval for Org3 completed successfully!"



peer lifecycle chaincode commit \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name $CHAINCODE_NAME \
  --version 1.0 \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  --peerAddresses localhost:11051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt"


peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
-C mychannel -n $CHAINCODE_NAME \
--peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
--peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
--peerAddresses localhost:11051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt" \
-c '{"function":"InitLedger","Args":[]}'