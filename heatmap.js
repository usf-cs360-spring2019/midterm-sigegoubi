const width = 1280;
const height = 600;
const svg = d3.select("svg#heatmap");
console.assert(svg.size() == 1);
svg.attr("width", width);
svg.attr("height", height);

//Define plot margin
const margin = {
  top: 120,
  bottom: 60,
  left: 160,
  right: 40
};



//Read the data
d3.csv("HeatmapData.csv", function(data){
  var Hours = d3.map(data, function(d){return d.Hour;}).keys()
  var Neighbors = d3.map(data, function(d){return d.Neighbor;}).keys()

  //Check Point
  console.log(Hours);
  console.log(Neighbors);

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
    .domain(Neighbors)
    .padding(0.05);
  svg.append("g")
    .attr("id", "yAxis")
    .style("font-size", 15)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(d3.axisLeft(y).tickSize(0))
    .select(".domain").remove()

  // Build color scale
  var myColor = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlGn)
    .domain([0, 15, 30])


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

    // get height of tooltip


    div1.style("left", d3.event.pageX + "px")
    div1.style("top",  (d3.event.pageY + 20)  + "px");

  }

  var mouseout = function(d) {
    d3.selectAll("div#details").remove();
  }

  blocks = function(d){return d3.select(svg).select("g#rects").selectAll("rect");}
  svg.append("g").attr("id", "rects")
      .selectAll("rect")
      .data(data, function(d) {return d.Hour+':'+d.Neighbor;})
      .enter()
      .append("rect")
        .attr("x", function(d) { return x(d.Hour) })
        .attr("y", function(d) { return y(d.Neighbor) })
        .attr("transform", "translate(" + margin.left + "," + (margin.bottom)  + ")")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
          .style("fill", function(d) { return myColor(d.EfficiencyMin)} )
        .style("stroke-width", 4)
        .style("stroke", "none")
        .style("opacity", 0.8)
      .on("mouseover", mouseover)
      .on("mouseleave", mouseleave)
      .on("mousemove", mousemove)
      .on("mouseout", mouseout)

  svg.append("g").attr("id", "annotation");



})
