import React, { useEffect, useState } from "react";

function SelectorSDKS({ setSelectedSdks, numComparisons }) {
  const [sdks, setSdks] = useState([]);
  const [sdkSelectionArr, setSdkSelectionArr] = useState([]);

  useEffect(() => {
    fetch("/api/sdk")
      .then((res) => res.json())
      .then((sdkList) => setSdks(sdkList));
  }, []);

  const disabledSelect = (
    <option value="DEFAULT" disabled>
      Choose sdk
    </option>
  );

  const mapSdks = (index) =>
    sdks.map((item) => (
      <option
        key={item.id}
        onClick={() => {
          const arrCopy = sdkSelectionArr;
          arrCopy[index] = item.id;
          setSdkSelectionArr(arrCopy);
          sdkSelectionArr.length === numComparisons && createSelectedSdksObj();
        }}
      >
        {item.name} - {item.id}
      </option>
    ));

  const getSelects = () => {
    let selectors = [];
    for (let i = 0; i < numComparisons; i++) {
      selectors.push(
        <select defaultValue="DEFAULT" key={i}>
          {disabledSelect}
          {mapSdks(i)}
        </select>
      );
    }
    return selectors;
  };

  const createSelectedSdksObj = () => {
    const selectedSdksObj = {};

    if (sdkSelectionArr.includes(undefined)) {
      alert(`Choose *${numComparisons}* sdks`);
      return;
    }

    try {
      for (let i = 0; i < numComparisons; i++) {
        selectedSdksObj[i] = sdkSelectionArr[i];
      }
      if (new Set(sdkSelectionArr).size < numComparisons) {
        alert(`Look up ${numComparisons} different sdks`);
      } else {
        setSelectedSdks(selectedSdksObj);
      }
    } catch (err) {
      alert(`Select ${numComparisons} sdks.`);
    }
  };

  return (
    <div>
      <h2>Select {''+numComparisons} SDKS</h2>
      {getSelects()}
    </div>
  );
}

export default SelectorSDKS;