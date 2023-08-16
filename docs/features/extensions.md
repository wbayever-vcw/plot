# Extending Plot

## The render method {#render}

Each [mark](./marks.md) has a render method that is called once for each facet (unless its data for that facet is empty). This method is responsible for drawing the mark. You can extend (or replace) this method by specifying the **render** mark option as a custom function.

:::warning
Note that, in general, we do not recommend using this low-level interface when a more high-level option exists. It is meant for use by extensions developers more than by users.
:::

The render function is called with the following six arguments:

* *index*: the index of the facet
* *scales*: the scale functions and descriptors
* *values*: the scaled and raw channels
* *dimensions*: the dimensions of the facet
* *context*: the context
* *next*: the next render method in the chain

The function is expected to return a single SVG node, or null or undefined if the facet should be skipped. Typically, it returns a [&lt;g>](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g) container, with a child node (say, a [&lt;circle>](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle)) for each valid data point.

The *index* is an array of indices in the channels, that represent the points to be drawn in the current facet. The *scales* object contains the scale functions, indexed by name, and an additional scales property with the scales descriptors, also indexed by name.

For example, the following code will log the color associated with the Torgersen category ("#e15759") and the [instantiated color scale object](./plots.md#plot_scale), and will not render anything to the chart.
```js
Plot.dot(penguins, {
  x: "culmen_length_mm",
  y: "culmen_depth_mm",
  fill: "island",
  render(index, scales, values, dimensions, context, next) {
    console.log(scales.color("Torgersen"));
    console.log(scales.scales.color);
  }
}).plot()
```

The *values* object contains the scaled channels, indexed by name, and an additional channels property with the unscaled channels, also indexed by name. For example:

```js
Plot.dot(penguins, {
  x: "culmen_length_mm",
  y: "culmen_depth_mm",
  fx: "species",
  fill: "island",
  render(index, scales, values, dimensions, context, next) {
    const i = index[0];
    console.log(i, values.fill[i], values.channels.fill.value[i]);
  }
}).plot()
```

will output the following three lines to the console, with each line containing the index of the first penguin of the current facet, its fill color, and the underlying (unscaled) category:

```js
0 '#e15759' 'Torgersen'
152 '#f28e2c' 'Dream'
220 '#4e79a7' 'Biscoe'
```

The *dimensions* object contains the width, height, marginLeft, marginTop, marginRight, and marginBottom of the frame. For example, to draw an ellipse that extends to the edges:

```js
Plot.plot({
  marks: [
    function (index, scales, values, dimensions, context, next) {
      const e = context.document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      e.setAttribute("rx", (dimensions.width - dimensions.marginLeft - dimensions.marginRight) / 2);
      e.setAttribute("ry", (dimensions.height - dimensions.marginTop - dimensions.marginBottom) / 2);
      e.setAttribute("cx", (dimensions.width + dimensions.marginLeft - dimensions.marginRight) / 2);
      e.setAttribute("cy", (dimensions.height + dimensions.marginTop - dimensions.marginBottom) / 2);
      e.setAttribute("fill", "red");
      return e;
    }
  ]
})
```

The *context* contains several useful globals:
* document - the [document object](https://developer.mozilla.org/en-US/docs/Web/API/Document)
* ownerSVGElement - the chart’s bare svg element
* className - the [class name](./plots.md#other-options) of the chart (*e.g.*, "plot-d6a7b5")
* projection - the [projection](./projections.md) stream, if any

:::tip
When writing a plugin, prefer *context*.document to the global document; this will allow your code to run in different contexts such as a server-side rendering environment.
:::

The last argument, *next*, is a function that can be called to continue the render chain. For example, if you wish to animate a mark to fade in, you can render it as usual, immediately set its opacity to 0, then bring it to life with D3:

```js
Plot.dot(penguins, {
  x: "culmen_length_mm",
  y: "culmen_depth_mm",
  fill: "island",
  render(index, scales, values, dimensions, context, next) {
    const g = next(index, scales, values, dimensions, context);
    d3.select(g)
      .selectAll("circle")
      .style("opacity", 0)
      .transition()
      .delay(() => Math.random() * 5000)
      .style("opacity", 1);
    return g;
  }
}).plot()
```

:::info
Note that Plot’s marks usually set the attributes of the nodes than their styles. This allows you to play with the styles — which have a higher priority than the attributes — without conflicting.
:::

Here is another example, where we render the dots one by one:
```js
Plot.dot(penguins, {
  x: "culmen_length_mm",
  y: "culmen_depth_mm",
  fill: "island",
  render(index, scales, values, dimensions, context, next) {
    let node = next(index, scales, values, dimensions, context);
    let k = 0;
    requestAnimationFrame(function draw() {
      const newNode = next(index.slice(0, ++k), scales, values, dimensions, context);
      node.replaceWith(newNode);
      node = newNode;
      if (node.isConnected && k < index.length) requestAnimationFrame(draw);
    });
    return node;
  }
}).plot()
```

:::info
A similar technique is used by Plot’s [pointer](../interactions/pointer.md) transform to render the point closest to the pointer.
:::
