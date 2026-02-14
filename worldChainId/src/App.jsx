import { useState } from "react";
import "./App.css";
import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";

const APP_ID = import.meta.env.VITE_WORLD_APP_ID;
const ACTION = import.meta.env.VITE_WORLD_ACTION;

function App() {
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (proof) => {
    console.log("=== handleVerify called ===");
    console.log("Proof received:", JSON.stringify(proof, null, 2));

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
            onClick={open}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Verify with World ID
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
