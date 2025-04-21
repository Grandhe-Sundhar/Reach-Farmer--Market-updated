var margin = [20, 120, 20, 140],
    width = 1280 - margin[1] - margin[3],
    height = 800 - margin[0] - margin[2],
    i = 0,
    duration = 1250,
    root;

var tree = d3.layout.tree().size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var vis = d3.select("#body").append("svg:svg")
    .attr("width", width + margin[1] + margin[3])
    .attr("height", height + margin[0] + margin[2])
  .append("svg:g")
    .attr("transform", "translate(" + margin[3] + "," + margin[0] + ")");

// Group color mapping
var groupColors = {
  "PGL": "#3f51b5",
  "Vendors": "#388e3c",
  "Funders": "#f57c00",
  "Market Attendee": "#00796b"
};

var tooltip = d3.select("#tooltip");


d3.json("arf.json", function(json) {
  root = json;
  root.x0 = 100;  // Pulls diagram closer to top
  root.y0 = 0;

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  root.children.forEach(collapse);
  update(root);
});

function update(source) {
  var nodes = tree.nodes(root).reverse();

  // Assign X spacing per level
  nodes.forEach(function(d) { d.y = d.depth * 180; });

  var node = vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Node enter
  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on("click", function(d) {
        toggle(d);
        update(d);

      
      })

      .on("mouseover", function(d) {
        tooltip.style("display", "block")
               .html("<strong>" + d.name + ":</strong><br/>" + (d.description || ""))
               .style("left", (d3.event.pageX + 15) + "px")
               .style("top", (d3.event.pageY + 15) + "px");
      })
      .on("mousemove", function(d) {
        tooltip.style("left", (d3.event.pageX + 15) + "px")
               .style("top", (d3.event.pageY + 15) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("display", "none");
      });
      

  // Circle for each node
  nodeEnter.append("svg:circle")
      .attr("r", 1e-6)
      .style("fill", function(d) {
        return d._children ? (groupColors[d.group] || "lightsteelblue") : "#fff";
      });

  // Node text (clickable if url exists)
  nodeEnter.append('a')
      .attr("target", "_blank")
      .attr('xlink:href', function(d) { return d.url || null; })
      .append("svg:text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function(d) { return d.name; })
      .style("fill", "black")
      .style("fill-opacity", 1e-6);

  // Tooltip for description
  nodeEnter.append("svg:title")
    .text(function(d) {
      return d.description || "";
    });

    

  // Update transition
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

  nodeUpdate.select("circle")
      .attr("r", 6)
      .style("fill", function(d) {
        return d._children ? (groupColors[d.group] || "lightsteelblue") : "#fff";
      });

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Exit transition
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

  nodeExit.select("circle").attr("r", 1e-6);
  nodeExit.select("text").style("fill-opacity", 1e-6);

  // Draw links
  var link = vis.selectAll("path.link")
      .data(tree.links(nodes), function(d) { return d.target.id; });

  // Enter links
  link.enter().insert("svg:path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      })
    .transition()
      .duration(duration)
      .attr("d", diagonal);

  // Update links
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Exit links
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash positions
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Toggle function
function toggle(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
}
