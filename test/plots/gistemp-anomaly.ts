import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

export async function gistempAnomaly() {
  const data = await d3.csv<any>("data/gistemp.csv", d3.autoType);
  return Plot.plot({
    y: {
      label: "Temperature anomaly (°C)",
      tickFormat: "+f",
      grid: true
    },
    color: {
      scheme: "BuRd"
    },
    marks: [Plot.ruleY([0]), Plot.dot(data, {x: "Date", y: "Anomaly", stroke: "Anomaly"})]
  });
}
