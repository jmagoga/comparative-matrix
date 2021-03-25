import React, { useEffect, useState } from "react";
import MatrixSquare from "./MatrixSquare";
import { merge } from "lodash";

function Matrix({ selectedSdks, allSdksInfo, setAllSdksInfo, numComparisons }) {
  const [sdksIds, setSdksIds] = useState([]);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showSampleApps, setShowSampleApps] = useState(false);

  function onMouseEnter(id) {
    if (!id) return;
    if (allSdksInfo?.[id]?.hasOwnProperty("sample_apps")) {
      setShowSampleApps(id);
    } else {
      fetch(`/api/sdk/sample_apps?sdk_id=${id}`)
        .then((res) => res.json())
        .then((res) => {
          const data = res;
          let objCopy = Object.assign({}, allSdksInfo);
          objCopy = merge(objCopy, data);
          setAllSdksInfo(objCopy);
          setShowSampleApps(id);
        });
    }
  }

  useEffect(() => {
    (async function () {
      const selectedSdksIds = Object.values(selectedSdks);
      setSdksIds(selectedSdksIds);
      if (!selectedSdksIds.length) return;

      setShowMatrix(false);

      let comparedCount = 0;

      const notComparedIds = [];

      selectedSdksIds.forEach((id, i) => {
        for (let j = i + 1; j < selectedSdksIds.length; j++) {
          if ( allSdksInfo?.[id]?.["churned_to"]?.hasOwnProperty( selectedSdksIds[j])) {
            comparedCount += 1;
            if (comparedCount === numComparisons) {
              setShowMatrix(true);
            }
          } else {
            notComparedIds.push([id, selectedSdksIds[j]]);
          }
        }
      });

      let objCopy = Object.assign({}, allSdksInfo);

      for (const [id1, id2] of notComparedIds) {
        const res = await fetch(`/api/sdk/churn?sdk1_id=${id1}&sdk2_id=${id2}`);
        const data = await res.json();

        const copyPreviousObj = Object.assign({}, objCopy);

        objCopy = merge(objCopy, data);

        const responseIds = Object.keys(data);

        for (const id of responseIds) {
          const new_churned_to = objCopy[id]["churned_to"];
          const new_acquired_from = objCopy[id]["acquired_from"];

          if (copyPreviousObj[id]) {
            objCopy[id]["churned_to"] = {
              ...new_churned_to,
              ...copyPreviousObj[id]["churned_to"],
            };
            objCopy[id]["acquired_from"] = {
              ...new_acquired_from,
              ...copyPreviousObj[id]["acquired_from"],
            };
          }
        }
      }

      for (const id of selectedSdksIds) {
        if (!allSdksInfo[id]?.["num_installed_apps"]) {
          const res = await fetch(`/api/sdk/general_info?sdk_id=${id}`);
          const data = await res.json();
          objCopy[id]["num_installed_apps"] = data["num_installed_apps"];
          objCopy[id]["acquired_total"] = data["acquired_total"];
          objCopy[id]["churned_total"] = data["churned_total"];
          objCopy[id]["name"] = data["name"];
        }
      }
      setAllSdksInfo(objCopy);
      setShowMatrix(true);
    })();
    // eslint-disable-next-line
  }, [selectedSdks]);

  function displayMatrix() {
    const matrixSquares = [];
    const outerArr = [];

    // creates matrix inner array
    for (let i = 0; i < numComparisons; i++) {
      const reorderedIds = [...sdksIds];

      if (i !== 0) {
        const removed = reorderedIds.splice(0, i);
        reorderedIds.push(...removed);
      }

      let val;
      const innerArr = [];
      let churned_total = allSdksInfo[reorderedIds[0]]["churned_total"];

      for (let j = 0; j < numComparisons; j++) {
        if (j === 0) {
          val = allSdksInfo[reorderedIds[0]]["num_installed_apps"];
        } else {
          val = allSdksInfo[reorderedIds[0]]["churned_to"][reorderedIds[j]];
          churned_total -= val;
        }
        const innerArrPosition = i + j < numComparisons ? i + j : (i + j) % numComparisons;
        innerArr[innerArrPosition] = val;
      }
      innerArr.push(churned_total);
      outerArr.push(innerArr);
    }

    let totalNumApps = allSdksInfo["total_num_apps"];

    const arr = [];

    // creates matrix last row
    for (let i = 0; i < outerArr.length; i++) {
      let sdkTotalInitial = outerArr[i][i];
      let sdkTotal = sdkTotalInitial;
      for (let j = 0; j < outerArr.length; j++) {
        if (outerArr[j][i] !== sdkTotalInitial) {
          sdkTotal -= outerArr[j][i];
        }
      }
      totalNumApps -= sdkTotalInitial;
      arr.push(sdkTotal);
    }

    const lastRow = [...arr, totalNumApps];

    outerArr.push(lastRow);

    // creates array of MatrixSquares to be displayed. Adds sdk names and creates the last column.
    outerArr.forEach((row, j) => {
      const numbers = [];
      const squareName = j !== numComparisons && allSdksInfo[selectedSdks[j]] ? allSdksInfo[selectedSdks[j]].name : "(none)";

      // pushes sdk names to the left of matrix
      numbers.push(<MatrixSquare key={`name-${j}`} name number={squareName} />);

      // creates all of the squares to be displayed.
      row.forEach((number, i) => {
        numbers.push(
          <MatrixSquare
            key={i}
            id={sdksIds[j]}
            number={number}
            total={allSdksInfo["total_num_apps"]}
            onMouseEnter={() => onMouseEnter(sdksIds[j])}
            onMouseLeave={() => setShowSampleApps(false)}
          />
        );
      });
      matrixSquares.push(<div key={`div-${j}`}>{numbers}</div>);
    });

    return matrixSquares;
  }

  return (
    <div>
      {showMatrix && (
        <>
          {displayMatrix()}
          <br />
          {showSampleApps && "Apps which use this SDK: " + allSdksInfo[showSampleApps]["sample_apps"].join(", ")}
        </>
      )}
    </div>
  );
}

export default Matrix;