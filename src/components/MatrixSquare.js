import React from "react";

const style = {
  height: "17vmin",
  width: "17vmin",
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "calc(10px + 1vmin)",
};

function getStyle(name, percent) {
  const bgColor = percent ? getColor(percent) : 'fff'

  const newStyle = {
    ...style,
    backgroundColor: bgColor, 
    border: name ? 'none' : '1px solid black',
    width: name ? '20vmin' : '17vmin'
  }

  return newStyle
}

const getColor = (percent) => {
  if (percent < 1) return "#fff";
  if (percent < 5) return "#ffbaba";
  if (percent < 10) return "#ff7878";
  if (percent < 20) return "#ff3d3d";
  if (percent < 25) return "#ff0505";
  if (percent < 50) return "#a80000";
  if (percent < 75) return "#750000";
  return "#8c0000";
};

function MatrixSquare({ name, number, total, id, onMouseEnter, onMouseLeave }) {

  const percent = Math.floor((100 * number) / total);

  return (
    <div
      style={getStyle(name, percent)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <p>{String(number)}</p>
    </div>
  );
}

export default MatrixSquare;
