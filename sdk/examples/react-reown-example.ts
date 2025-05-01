import React, { useEffect, useState } from "react";
import { RWAMarketplaceSDK } from "../index";
import { useAppKit } from "@reown/appkit";

function MyComponent() {
  const { walletClient } = useAppKit();
  const [sdk, setSdk] = useState<RWAMarketplaceSDK>();

  useEffect(() => {
    if (walletClient) {
      RWAMarketplaceSDK.connect(walletClient).then(setSdk);
    }
  }, [walletClient]);

  const handleList = async () => {
    if (!sdk) return;
    await sdk.listRWA({
      title: "My RWA",
      description: "Real-world asset",
      image: "ipfs://...",
      tags: ["real-estate"],
      category: "property",
    });
  };

  return <button onClick={handleList}>List RWA</button>;
}
