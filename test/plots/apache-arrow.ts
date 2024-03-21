import * as Plot from "@observablehq/plot";
import * as Arrow from "apache-arrow";

export async function apacheArrow() {
  const data = Arrow.tableFromArrays({
    id: [1, 2, 3],
    name: ["Alice", "Bob", "Charlie"],
    age: [35, 25, 45]
  });
  return Plot.barY({length: data.numRows}, {x: data.getChild("name"), y: data.getChild("age")}).plot();
}
