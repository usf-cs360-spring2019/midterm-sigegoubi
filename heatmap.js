const width = 1280;
const height = 600;
const svg = d3.select("svg#heatmap");
console.assert(svg.size() == 1);
svg.attr("width", width);
svg.attr("height", height);

//Define plot margin
const margin = {
  top: 100,
  bottom: 40,
  left: 180,
  right: 40
};



//Read the data
var Hours = d3.map();
var Neighbors = d3.map();
d3.csv("Heatmap1.csv").then(function(data){

  //Extract Hour of the Day
  for (let i = 0; i < data.length; i++)
  {
    var hour = data[i].Hour_of_the_Day;
    if (Hours.has(hour))
    {
      Hours.set(hour, Hours.get(hour) + 1);
    }
    else
    {
      Hours.set(hour, 1);
    }
  }

  //Extract Neighborhoods
  for (let j = 0; j < data.length; j++)
  {
    var neighbor = data[j].Neighbor;
    if (Neighbors.has(neighbor))
    {
      Neighbors.set(neighbor, Neighbors.get(neighbor) + 1);
    }
    else
    {
      Neighbors.set(neighbor, 1);
    }
  }

  Hours = Hours.keys()
  Neighbors = Neighbors.keys()

  //Check Point
  console.log(Hours);
  console.log(Neighbors);

  var SortedNeighbor = ["Potrero Hill", "West of Twin Peaks", "Presidio Heights", "Pacific Heights", "Seacliff", "Nob Hill", "Bayview Hunters Point", "Visitacion Valley", "Tenderloin", "Chinatown"]
  SortedNeighbor = SortedNeighbor.reverse();
  var richNeighbor = ["Potrero Hill", "West of Twin Peaks", "Presidio Heights", "Pacific Heights", "Seacliff"]
  // Build X scales and axis:
  var x = d3.scaleBand()
    .range([ 0, width - margin.left - margin.right])
    .domain(Hours)
    .padding(0.05);
  svg.append("g")
    .attr("id", "xAxis")
    .style("font-size", 15)
    .attr("transform", "translate(" + margin.left + "," + (height - margin.bottom)  + ")")
    .call(d3.axisBottom(x).tickSize(0))
    .select(".domain").remove()


  // Build Y scales and axis:
  var y = d3.scaleBand()
    .range([height - margin.top - margin.bottom, 0])
    .domain(SortedNeighbor)
    .padding(0.05);
  svg.append("g")
      .attr("id", "yAxis")
      .style("font-size", 15)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove()




  function midpoint(range) {
    return range[0] + (range[1] - range[0]) / 2.0;
  }

  let xMiddle = margin.left + midpoint(x.range());
  let yMiddle = margin.top + midpoint(y.range());

  svg.append("text")
    .attr("class", "axis-title")
    .text("Hour of the Day")
    .attr("x", xMiddle)
    .attr("y", height)
    .attr("dy", -6)
    .attr("text-anchor", "middle")

  // it is easier to rotate text if you place it in a group first
  // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/rotate

  let yGroup = svg.append("g")
    // set the position by translating the group
    .attr("transform",   "translate(4, " + yMiddle + ")");

  let yTitle = yGroup.append("text")
    .attr("class", "axis-title")
    .text("Neighborhoods");

  // keep x, y at 0, 0 for rotation around the origin
  yTitle.attr("x", 0);
  yTitle.attr("y", 0);

  yTitle.attr("dy", "1.75ex");
  yTitle.attr("text-anchor", "middle");
  yTitle.attr("transform", "rotate(-90)");

  // Build color scale
  var colorScale = d3.scaleDiverging(d3.interpolateBrBG)
    .domain([3, 8, 15]);


  let legendWidth = 200;
  let legendHeight = 20;

  let legend = svg.append("g").attr("id", "color-legend");
  legend.attr("transform", "translate(" + (width - margin.right - legendWidth) + "," + 20  + ")")

  let title = legend.append("text")
    .attr("class", "axis-title")
    .attr("dy", 12)
    .text("Life Saving Response Time *");

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
    .attr("transform", "translate(0, 18)")
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
  var mouseover = function(d) {
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)
  }
  var mouseleave = function(d) {
    d3.select(this)
      .style("stroke", "none")
      .style("opacity", 0.8)
  }

  var mousemove = function(d) {
    let div = d3.select("body")
              .append("div")
              .attr("class", "tooltip")
              .attr("id", "details")
    let rows = div.append("table")
      .selectAll("tr")
      .data(Object.keys(d))
      .enter()
      .append("tr");

    rows.append("th").text(key => key);
    rows.append("td").text(key => d[key]);

    let div1 = d3.select("div#details");

    div1.style("left", d3.event.pageX + "px")
    div1.style("top",  (d3.event.pageY + 20)  + "px");

  }

  var mouseout = function(d) {
    d3.selectAll("div#details").remove();
  }

  blocks = function(d){return d3.select(svg).select("g#rects").selectAll("rect");}
  svg.append("g").attr("id", "rects")
      .selectAll("rect")
      .data(data, function(d) {return d.Hour_of_the_Day+':'+d.Neighbor;})
      .enter()
      .append("rect")
        .attr("x", function(d) { return x(d.Hour_of_the_Day) })
        .attr("y", function(d) { return y(d.Neighbor) })
        .attr("transform", "translate(" + margin.left + "," + (margin.bottom)  + ")")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
          .style("fill", function(d) { return colorScale(d.Response_Efficiency)} )
        .style("stroke-width", 4)
        .style("stroke", "none")
        .style("opacity", 0.8)
      .on("mouseover", mouseover)
      .on("mouseleave", mouseleave)
      .on("mousemove", mousemove)
      .on("mouseout", mouseout)

  svg.append("g").attr("id", "annotation");
})
