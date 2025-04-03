tar -xvzf kubo-linux-amd64.tar.gz && \
cd kubo && \
sudo mv ipfs /usr/local/bin/ && \
sudo chmod +x /usr/local/bin/ipfs && \
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc && \
source ~/.bashrc && \
ipfs version && \
ipfs init && \
ipfs daemon
