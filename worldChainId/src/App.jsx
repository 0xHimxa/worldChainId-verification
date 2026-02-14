import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";

const APP_ID = import.meta.env.VITE_WORLD_APP_ID;
const ACTION = import.meta.env.VITE_WORLD_ACTION;
const SUPPORTED_CHAIN_IDS =
  import.meta.env.VITE_SUPPORTED_CHAIN_IDS ?? "1,11155111,480,4801";

function App() {
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [chainIdHex, setChainIdHex] = useState(null);
  const [walletError, setWalletError] = useState(null);

  const supportedChainIdSet = useMemo(() => {
    return new Set(
      SUPPORTED_CHAIN_IDS.split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isInteger(id) && id > 0)
    );
  }, []);

  const chainId = chainIdHex ? parseInt(chainIdHex, 16) : null;
  const isConnected = Boolean(walletAddress);
  const isSupportedChain = chainId !== null && supportedChainIdSet.has(chainId);
  const canVerify = isConnected && isSupportedChain;

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    let unmounted = false;

    const syncWalletState = async () => {
      try {
        const [accounts, nextChainIdHex] = await Promise.all([
          window.ethereum.request({ method: "eth_accounts" }),
          window.ethereum.request({ method: "eth_chainId" }),
        ]);

        if (unmounted) return;

        setWalletAddress(accounts?.[0] ?? null);
        setChainIdHex(nextChainIdHex ?? null);
      } catch (err) {
        if (unmounted) return;
        setWalletError(err?.message ?? "Failed to read wallet state.");
      }
    };

    const handleAccountsChanged = (accounts) => {
      setWalletAddress(accounts?.[0] ?? null);
      setProof(null);
      setError(null);
    };

    const handleChainChanged = (nextChainIdHex) => {
      setChainIdHex(nextChainIdHex);
      setProof(null);
      setError(null);
    };

    syncWalletState();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      unmounted = true;
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const connectWallet = async () => {
    setWalletError(null);

    if (!window.ethereum) {
      setWalletError("No Ethereum wallet found. Install MetaMask or a compatible wallet.");
      return;
    }

    try {
      const [accounts, nextChainIdHex] = await Promise.all([
        window.ethereum.request({ method: "eth_requestAccounts" }),
        window.ethereum.request({ method: "eth_chainId" }),
      ]);

      setWalletAddress(accounts?.[0] ?? null);
      setChainIdHex(nextChainIdHex ?? null);
    } catch (err) {
      setWalletError(err?.message ?? "Wallet connection rejected.");
    }
  };


  const handleVerify = async (proof) => {
    if (!canVerify) {
      throw new Error(
        "Wallet must be connected on a supported EVM chain before verification."
      );
    }

    const verificationPayload = {
      walletAddress,
      chainId,
      proof,
    };

    console.log("=== handleVerify called ===");
    console.log(
      "Wallet + proof payload:",
      JSON.stringify(verificationPayload, null, 2)
    );

    // For now, just accept the proof (no server-side verification)
    // In production, you'd send this to your backend to verify
  };

  const onSuccess = (result) => {
    console.log("=== onSuccess called ===");
    console.log("Verification successful:", JSON.stringify(result, null, 2));
    setProof(result);
    setError(null);
  };

  const onError = (error) => {
    console.error("=== onError called ===");
    console.error("Verification error:", JSON.stringify(error, null, 2));
    setError(error);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "40px",
        alignItems: "center",
      }}
    >
      <h2>Step 1: Connect Wallet</h2>
      <button
        onClick={connectWallet}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        {isConnected ? "Reconnect Wallet" : "Connect EVM Wallet"}
      </button>

      <div style={{ fontSize: "12px", color: "#555", textAlign: "center" }}>
        <div>
          <strong>Wallet:</strong> {walletAddress || "Not connected"}
        </div>
        <div>
          <strong>Chain ID:</strong> {chainId || "Unknown"}
        </div>
        <div>
          <strong>Chain supported:</strong> {isSupportedChain ? "Yes" : "No"}
        </div>
      </div>

      {walletError && (
        <p style={{ color: "#b00020", fontWeight: "bold" }}>{walletError}</p>
      )}

      <hr style={{ margin: '20px 0' }} />


      
      <h2>World Chain Staging Environment</h2>
      <div style={{ fontSize: "12px", color: "#555", textAlign: "center" }}>
        <div>
          <strong>App ID:</strong> {APP_ID}
        </div>
        <div>
          <strong>Action:</strong> {ACTION}
        </div>
      </div>

      <IDKitWidget
        app_id={APP_ID}
        action={ACTION}
        verification_level={VerificationLevel.Device}
        handleVerify={handleVerify}
        onSuccess={onSuccess}
        onError={onError}
      >
        {({ open }) => (
          <button
            onClick={() => canVerify && open()}
            disabled={!canVerify}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              cursor: canVerify ? "pointer" : "not-allowed",
              opacity: canVerify ? 1 : 0.5,
            }}
          >
            {canVerify
              ? "Verify with World ID"
              : "Connect wallet on a supported chain to verify"}
          </button>
        )}
      </IDKitWidget>

      {proof && (
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "green", fontWeight: "bold" }}>
            ✅ Successfully verified!
          </p>
          <details>
            <summary>View Proof Data</summary>
            <pre
              style={{
                textAlign: "left",
                maxWidth: "500px",
                overflow: "auto",
                fontSize: "12px",
                background: "#f0f0f0",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              {JSON.stringify(proof, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {error && (
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "red", fontWeight: "bold" }}>
            ❌ Verification failed
          </p>
          <p style={{ color: "#b00020", fontWeight: "bold" }}>
            code: {error?.code || "unknown"}
          </p>
          <p style={{ color: "#b00020", fontWeight: "bold" }}>
            message: {error?.message || "unknown"}
          </p>
          <pre
            style={{
              textAlign: "left",
              maxWidth: "500px",
              overflow: "auto",
              fontSize: "12px",
              background: "#fff0f0",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
