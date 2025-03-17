console.log("Starting D3 script...");

// Set up dimensions and margins for line chart
const lineMargin = { top: 500, right: 500, bottom: 500, left: 60 };
const lineWidth = 100 - lineMargin.left - lineMargin.right;
const lineHeight = 400 - lineMargin.top - lineMargin.bottom;

// Append SVG for line chart
const lineSvg = d3.select("#lineChart")
    .append("svg")
    .attr("width", lineWidth + lineMargin.left + lineMargin.right)
    .attr("height", lineHeight + lineMargin.top + lineMargin.bottom)
    .append("g")
    .attr("transform", `translate(${lineMargin.left},${lineMargin.top})`);

// Scales for line chart
const xScale = d3.scaleTime().range([0, lineWidth]);
const yScale = d3.scaleLinear().range([lineHeight, 0]);
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Line generator for trends
const line = d3.line()
    .x(d => xScale(new Date(d.Year, 0)))
    .y(d => yScale(d["Binary Rating"]))
    .curve(d3.curveBasis);

// Load data and render the line chart
d3.json("../data/sector_yearly_data.json").then(data => {
    console.log("✅ Loaded aggregated sector data:", data);

    // Nest data by Sector
    const nestedData = d3.groups(data, d => d.Sector);

    // Set up SVG dimensions and margins
    const margin = { top: 50, right: 150, bottom: 50, left: 60 };
    const width = 940 - margin.left - margin.right;
    const height = 580 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#lineChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Line generator
    const line = d3.line()
        .x(d => xScale(new Date(d.Year, 0)))
        .y(d => yScale(d['Binary Rating']))
        .curve(d3.curveBasis); // Smooth curve

    // Set the domains for scales
    xScale.domain(d3.extent(data, d => new Date(d.Year, 0)));
    yScale.domain([0, 1]);
    colorScale.domain(nestedData.map(d => d[0]));

    // Draw lines for each sector
    const paths = svg.selectAll(".line")
        .data(nestedData)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d[1]))
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d[0]))
        .attr("stroke-width", 2)
        .attr("opacity", 0.6);

    // Add tooltip for interactivity
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "5px")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("display", "none");

    paths.on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1).attr("stroke-width", 3); // Highlight the line
        tooltip.style("display", "block")
            .html(`
                <strong>Sector:</strong> ${d[0]}<br>
                <strong>Year Range:</strong> ${d3.extent(d[1], e => e.Year).join(" - ")}
            `);
    }).on("mousemove", function (event) {
        tooltip.style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 20 + "px");
    }).on("mouseout", function () {
        d3.select(this).attr("opacity", 0.6).attr("stroke-width", 2); // Reset style
        tooltip.style("display", "none");
    });

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y")))
        .append("text")
        .attr("y", 40)
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text("Year");

    svg.append("g")
        .call(d3.axisLeft(yScale))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text("Binary Rating");

    // Add chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Sector-Based Trends in Binary Ratings");

    // Add legend with checkboxes for filtering sectors
    const legend = d3.select("#lineChartControls")
        .style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("margin-top", "30px");

    nestedData.forEach((d, i) => {
        const container = legend.append("div").style("margin-right", "10px");

        container.append("input")
            .attr("type", "checkbox")
            .attr("id", `sector-${i}`)
            .attr("checked", true)
            .on("change", function () {
                const isChecked = d3.select(this).property("checked");
                svg.selectAll(".line")
                    .filter(line => line[0] === d[0])
                    .transition()
                    .duration(500)
                    .attr("opacity", isChecked ? 0.6 : 0);
            });

        container.append("label")
            .attr("for", `sector-${i}`)
            .style("margin-left", "5px")
            .text(d[0]);
    });

    console.log("✅ Sector-level line chart rendered successfully with interactivity.");
}).catch(error => {
    console.error("❌ Error loading data:", error);
});

d3.json("../data/feature_importance_data.json").then(data => {
    console.log("✅ Feature Importance Data Loaded:", data);

    // Initialize radar chart controls
    createRadarChartControls(data);

}).catch(error => {
    console.error("❌ Error loading feature importance data:", error);
});

// Radar Chart Function
function updateRadarChart(data, selectedSectors) {
    const topFeatures = ["Debt/Equity Ratio", "Current Ratio", "EBIT Margin", "Operating Margin", "Return On Assets"]; 

    const radarWidth = 850; // Chart dimensions
    const radarHeight = 750;
    const radius = Math.min(radarWidth, radarHeight) / 2 - 90; 

    const radarSvg = d3.select("#radarChart")
        .html("") // Clear previous chart
        .append("svg")
        .attr("width", radarWidth)
        .attr("height", radarHeight)
        .append("g")
        .attr("transform", `translate(${radarWidth / 2},${radarHeight / 2})`);

    const angleScale = d3.scaleLinear()
        .domain([0, topFeatures.length])
        .range([-Math.PI / 2, Math.PI * 1.5]);

    const radialScale = d3.scaleLinear()
        .domain([-2.5, 1.5]) 
        .range([0, radius]);

    // Draw circular gridlines and axis labels
    for (let i = -2.5; i <= 1.5; i += 0.5) {
        radarSvg.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", radialScale(i))
            .attr("fill", "none")
            .attr("stroke", "#ddd");

        radarSvg.append("text")
            .attr("x", 0)
            .attr("y", -radialScale(i) - 5)
            .style("text-anchor", "middle")
            .style("font-size", "10px")
            .text(i);
    }

    // Draw feature axes and labels
    topFeatures.forEach((feature, i) => {
        const angle = angleScale(i);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        radarSvg.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", y)
            .attr("stroke", "gray")
            .attr("stroke-width", 1);

        // Adjust text positioning dynamically
        radarSvg.append("text")
            .attr("x", x * 1.2)  // Slightly extend
            .attr("y", y * 1.2)  
            .attr("dy", (angle > Math.PI / 2 && angle < (3 * Math.PI) / 2) ? "0.6em" : "-0.6em")  
            .attr("dx", (angle < 0.1 || angle > 2.9) ? "0" : (angle < Math.PI ? "0.6em" : "-0.6fem"))
            .style("text-anchor", () => {
                if (Math.abs(angle) < 0.1 || Math.abs(angle - Math.PI) < 0.1) return "middle";
                return angle < Math.PI ? "start" : "end"; 
            })
            .style("font-size", "12px")
            .text(feature);
    });


    // Draw radar areas for each selected sector
    const radarLine = d3.lineRadial()
        .radius(d => radialScale(d))
        .angle((d, i) => angleScale(i));

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(selectedSectors);

    selectedSectors.forEach(sector => {
        const sectorData = topFeatures.map(feature => {
            const entry = data[sector].find(d => d.Feature === feature);
            return entry ? entry.Coefficient : 0; 
        });

        sectorData.push(sectorData[0]); // Close the radar chart loop

        radarSvg.append("path")
            .datum(sectorData)
            .attr("d", radarLine)
            .attr("fill", colorScale(sector))
            .attr("fill-opacity", 0.2)
            .attr("stroke", colorScale(sector))
            .attr("stroke-width", 2);

        radarSvg.append("text")
            .attr("x", -radius)
            .attr("y", -radius + 20 + selectedSectors.indexOf(sector) * 15)
            .attr("fill", colorScale(sector))
            .style("font-size", "14px")
            .text(sector);
    });

    console.log(`✅ Radar Chart updated for sectors: ${selectedSectors.join(", ")}`);
}

// Create Checkboxes for Sector Selection
function createRadarChartControls(data) {
    const sectors = Object.keys(data);

    const controlsDiv = d3.select("#radarChartControls").html(""); // Clear existing controls

    sectors.forEach(sector => {
        const control = controlsDiv.append("div").style("margin-right", "10px");

        control.append("input")
            .attr("type", "checkbox")
            .attr("id", `radar-${sector}`)
            .attr("value", sector)
            .on("change", () => {
                const selectedSectors = [];
                controlsDiv.selectAll("input:checked").each(function () {
                    selectedSectors.push(this.value);
                });
                updateRadarChart(data, selectedSectors);
            });

        control.append("label")
            .attr("for", `radar-${sector}`)
            .style("margin-left", "5px")
            .text(sector);
    });

    // Preselect the first 3 sectors by default
    controlsDiv.selectAll("input")
        .property("checked", (_, i) => i < 3);

    const selectedSectors = sectors.slice(0, 3);
    updateRadarChart(data, selectedSectors);
}