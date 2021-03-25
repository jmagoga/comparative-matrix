import { useEffect, useState } from "react";
import "./App.css";
import Matrix from "./components/Matrix";
import SelectorSDKS from "./components/SelectorSDKS";

const MATRIX_COMPARISONS = 3

function App() {
  const [selectedSdks, setSelectedSdks] = useState({});
  const [allSdksInfo, setAllSdksInfo] = useState({});
  console.log('allSdksInfo', allSdksInfo)

  useEffect(() => {
    fetch("/api/app/count")
      .then((res) => res.json())
      .then((res) => {
        setAllSdksInfo({ total_num_apps: res });
      });
  }, []);

  return (
    <div className="App">
      <SelectorSDKS
        setSelectedSdks={setSelectedSdks}
        numComparisons={MATRIX_COMPARISONS}
      />
      <Matrix
        selectedSdks={selectedSdks}
        allSdksInfo={allSdksInfo}
        setAllSdksInfo={setAllSdksInfo}
        numComparisons={MATRIX_COMPARISONS}
      />
    </div>
  );
}

export default App;
