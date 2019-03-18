/*
 * a lot of this example is hard-coded to match our tableau prototype...
 * and this is a reasonable approach for your own visualizations.
 * however, there are ways to automatically calculate these hard-coded values
 * in our javascript/d3 code.
 */


// set svg size and plot margins
const width = 960;
const height = 600;

var resCategory = [
  "for-profit",
  "private non-profit",
  "public"
];

var colors = d3.scaleOrdinal().range([
  "#EDC948",
  "#FF9DA7",
  "#76B7B2"
]).domain(resCategory);

margin = {
  top: 10,
  bottom: 35,
  left: 50,
  right: 15
};

var plotWidth = width - margin.right - margin.left;
var plotHeight = height - margin.top - margin.bottom;

// select svg
const svg = d3.select("#bubbleChart");
console.assert(svg.size() == 1);

// set svg size
svg.attr("width", width);
svg.attr("height", height);

// add plot region
const plot = svg.append("g").attr("id", "plot");

// transform region by margin
plot.attr("transform", translate(margin.left, margin.top));

/*
 * setup scales with ranges and the domains we set from tableau
 * defined globally for access within other functions
 */

const xScale = d3.scaleLinear()
  .range([0, width - margin.left - margin.right])
  .domain([100, 250]);

const yScale = d3.scaleLinear()
  .range([height - margin.top - margin.bottom, 50])
  .domain([300, 550]);

// area = pi r*r -- do not linearly scale the radius!
const sizeScale = d3.scaleSqrt()
  .range([1, 30])
  .domain([0, 2000]);

// the RdYlBu scheme is available both in tableau and d3
const colorScale = d3.scaleDiverging(d3.interpolateYlGnBu)
  .domain([37.7122, 37.79, 37.8235]);

// since we do not need the data for our domains, we can draw our axis/legends right away
drawAxis();
drawTitles();
drawColorLegend();
drawCircleLegend();

// load data and trigger draw
d3.csv("XFd3Data.csv", convert).then(draw);

function draw(data) {
  console.log("loaded:", data.length, data[0]);

  // sort by count so small circles are drawn last
  data.sort((a, b) => b.Number_of_Incidents - a.Number_of_Incidents);
  console.log("sorted:", data.length, data[0]);


  drawBubble(data);
  drawLabels(data);
}

function translate(x, y) {
  return "translate(" + String(x) + "," + String(y) + ")";
}

// https://beta.observablehq.com/@tmcw/d3-scalesequential-continuous-color-legend-example
function drawColorLegend() {
  let legendWidth = 200;
  let legendHeight = 20;

  let legend = svg.append("g").attr("id", "color-legend");

  legend.attr("transform", translate(width - margin.right - legendWidth - 10, height - 220))

  let title = legend.append("text")
    .attr("class", "axis-title")
    .attr("dy", 12)
    .text("Latitude of SF (South - North)");

  // lets draw the rectangle, but it won't have a fill just yet
  let colorbox = legend.append("rect")
    .attr("x", 0)
    .attr("y", 12 + 6)
    .attr("width", legendWidth)
    .attr("height", legendHeight);

  // we need to create a linear gradient for our color legend
  // this defines a color at a percent offset
  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/linearGradient

  // this is easier if we create a scale to map our colors to percents

  // get the domain first (we do not want the middle value from the diverging scale)
  let colorDomain = [d3.min(colorScale.domain()), d3.max(colorScale.domain())];

  let percentScale = d3.scaleLinear()
    .range([0, 100])
    .domain(colorDomain);

  // we have to first add gradients
  let defs = svg.append("defs");

  // add a stop per tick
  defs.append("linearGradient")
    .attr("id", "gradient")
    .selectAll("stop")
    .data(colorScale.ticks())
    .enter()
    .append("stop")
    .attr("offset", d => percentScale(d) + "%")
    .attr("stop-color", d => colorScale(d));

  // draw the color rectangle with the gradient
  colorbox.attr("fill", "url(#gradient)");

  // now we need to draw tick marks for our scale
  // we can create a legend that will map our data domain to the legend colorbox
  let legendScale = d3.scaleLinear()
    .domain(colorDomain)
    .range([0, legendWidth]);

  let legendAxis = d3.axisBottom(legendScale)
  legendAxis.tickValues(colorScale.domain());
  legendAxis.tickSize(legendHeight);
  legendAxis.tickSizeOuter(0);

  let axisGroup = legend.append("g")
    .attr("id", "color-axis")
    .attr("transform", translate(0, 18))
    .call(legendAxis);

  // now lets tighten up the tick labels a bit so they don't stick out
  axisGroup.selectAll("text")
    .each(function(d, i) {
      // set the first tick mark to anchor at the start
      if (i == 0) {
        d3.select(this).attr("text-anchor", "start");
      }
      // set the last tick mark to anchor at the end
      else if (i == legendAxis.tickValues().length - 1) {
        d3.select(this).attr("text-anchor", "end");
      }
    });

  // note how many more lines of code it took to generate the legend
  // than the base visualization!
}
/*
 * draw labels for pre-selected bubbles
 */
function drawLabels(data) {
  let labels = plot.append("g")
    .attr("id", "labels")
    .selectAll("text")
    .data(data)
    .enter()
    .filter(d => d.label)
    .append("text");

  labels.text(d => d.name);

  labels.attr("x", d => xScale(d.kMean));
  labels.attr("y", d => yScale(d.pMean));

  labels.attr("text-anchor", "middle");
  labels.attr("dy", d => (sizeScale(d.count) + 8));
}

/*
 * draw bubbles
 */
function drawBubble(data) {
  let bubbles = plot.append("g")
    .attr("id", "bubbles")
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle");

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
  bubbles.attr("cx", d => xScale(d.Avg_Dispatch_to_Received));
  bubbles.attr("cy", d => yScale(d.Avg_Scene_to_Dispatch));
  bubbles.attr("r",  d => sizeScale(d.Number_of_Incidents));

  bubbles.style("stroke", "gray");
  bubbles.style("fill", d => colorScale(d.Latitude));
  // bubbles.attr("data-legend", d => createLegend(d.type))
}

function createColor(data){
  switch(data) {
    case 1:
      return "rgb(118,183,178)";
    case 2:
      return "rgb(255,157,167)";
    case 3:
      return "rgb(237,201,72)";
    }
}

/*
 * this demonstrates d3-legend for creating a circle legend
 * it is made to work with d3v4 not d3v5 however
 */
function drawCircleLegend() {
  let legendWidth = 150;
  let legendHeight = 20;

  let legend = svg.append("g").attr("id", "circle-legend");

  legend.attr("transform", translate(width - margin.right - legendWidth - 60, height - margin.bottom - 5*legendHeight))

  // https://d3-legend.susielu.com/#size-linear
  var legendSize = d3.legendSize()
    .scale(sizeScale)
    .shape('circle')
    .cells(5)
    .ascending(true)
    .shapePadding(7)
    .labelOffset(10)
    .labelFormat("d")
    .title('Number Incidents')
    .orient('horizontal')

  legend.call(legendSize);

  // fix the title spacing
  legend.select("text.legendTitle")
  .attr("dy", -6);
}


function drawTitles() {
  let xMiddle = margin.left + midpoint(xScale.range());
  let yMiddle = margin.top + midpoint(yScale.range());

  // test middle calculation
  // svg.append("circle").attr("cx", xMiddle).attr("cy", yMiddle).attr("r", 5);

  let Title = svg.append("text")
    .attr("class", "title")
    .text("SFFD Efficiency Measured by Neighborhoods");

  Title.attr("x", xMiddle);
  Title.attr("y", margin.top);
  Title.attr("dy", +20);
  Title.attr("text-anchor", "middle"); // place the middle point of text on (x,y)

  let xTitle = svg.append("text")
    .attr("class", "axis-title")
    .text("Received Time to Dispatch Time(s)");

  xTitle.attr("x", xMiddle);
  xTitle.attr("y", height);
  xTitle.attr("dy", -4);
  xTitle.attr("text-anchor", "middle"); // place the middle point of text on (x,y)

  // it is easier to rotate text if you place it in a group first
  // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/rotate

  let yGroup = svg.append("g")
    // set the position by translating the group
    .attr("transform", translate(4, yMiddle));

  let yTitle = yGroup.append("text")
    .attr("class", "axis-title")
    .text("Dispatch Time to On-Scene Time(s)");

  // keep x, y at 0, 0 for rotation around the origin
  yTitle.attr("x", 0);
  yTitle.attr("y", 0);

  yTitle.attr("dy", "1.75ex");
  yTitle.attr("text-anchor", "middle");
  yTitle.attr("transform", "rotate(-90)");
}

/*
 * create axis lines
 */
 // ticks(numOfTicks, UnitOfTicks)
function drawAxis() {
  let xAxis = d3.axisBottom(xScale).ticks(10, "s").tickSizeOuter(0);
  let yAxis = d3.axisLeft(yScale).ticks(6, "s").tickSizeOuter(0);

  let xGrid = d3.axisBottom(xScale).ticks(10).tickSize(plotHeight / 11 * 10).tickFormat("");
  let yGrid = d3.axisLeft(yScale).ticks(6).tickSize(plotWidth).tickFormat("");
  svg.append("g")
    .attr("id", "x-axis")
    .attr("class", "axis")
    .attr("transform", translate(margin.left, height - margin.bottom))
    .call(xAxis);

  svg.append("g")
    .attr("class", "xgrid")
    .attr("transform", translate(margin.left, margin.top + plotHeight / 11))
    .call(xGrid)
    .lower()
    .select("path.domain").remove()

  svg.append("g")
    .attr("id", "y-axis")
    .attr("class", "axis")
    .attr("transform", translate(margin.left, margin.top))
    .call(yAxis);

  svg.append("g")
    .attr("class", "ygrid")
    .attr("transform", translate(margin.left + plotWidth, margin.top))
    .call(yGrid)
    .lower()
    .select("path.domain").remove()

}

/*
 * converts values as necessary and discards unused columns
 */
function convert(row) {
  let keep = {}

  keep.Region = row.Region;
  keep.Avg_Dispatch_to_Received = parseInt(row.Avg_Dispatch_to_Received);
  keep.Latitude = parseFloat(row.Latitude);
  keep.Avg_Scene_to_Dispatch = parseInt(row.Avg_Scene_to_Dispatch);
  keep.Number_of_Incidents = parseInt(row.Number_of_Incidents);

  return keep;
}

/*
 * calculates the midpoint of a range given as a 2 element array
 */
function midpoint(range) {
  return range[0] + (range[1] - range[0]) / 2.0;
}

/*
 * returns a translate string for the transform attribute
 */
function translate(x, y) {
  return "translate(" + String(x) + "," + String(y) + ")";
}
