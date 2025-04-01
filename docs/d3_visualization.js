
console.log("Starting D3 script...");
// Dimensions and margins for line chart
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

// Loading data and render the line chart
d3.json("../data/sector_yearly_data.json").then(data => {
    const nestedData = d3.groups(data, d => d.Sector);

    const margin = { top: 50, right: 150, bottom: 50, left: 60 };
    const width = 940 - margin.left - margin.right;
    const height = 580 - margin.top - margin.bottom;

    const svg = d3.select("#lineChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const line = d3.line()
        .x(d => xScale(new Date(d.Year, 0)))
        .y(d => yScale(d['Binary Rating']))
        .curve(d3.curveBasis);

    xScale.domain(d3.extent(data, d => new Date(d.Year, 0)));
    yScale.domain([0, 1]);
    colorScale.domain(nestedData.map(d => d[0]));

    const paths = svg.selectAll(".line")
        .data(nestedData)
        .enter()
        .append("path")
        .attr("class", d => `line sector-${d[0].replace(/\s+/g, "-")}`)
        .attr("d", d => line(d[1]))
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d[0]))
        .attr("stroke-width", 2)
        .attr("opacity", 0.6);

    const tooltip = d3.select("#tooltip");


    // Tooltip interactivity
    paths.on("mouseover", function (event, d) {
        const currentPath = d3.select(this);
        if (parseFloat(currentPath.style("opacity")) > 0) {
            currentPath.attr("opacity", 1).attr("stroke-width", 3);
            tooltip.style("display", "block")
            .html(`
                <div style="font-size: 14px;">
                    <strong>Sector:</strong> ${d[0]}<br>
                </div>
                `);
        }
    }).on("mousemove", function (event) {
        tooltip.style("left", event.pageX + 10 + "px")
               .style("top", event.pageY - 20 + "px");
    }).on("mouseout", function () {
        const currentPath = d3.select(this);
        if (parseFloat(currentPath.style("opacity")) > 0) {
            currentPath.attr("opacity", 0.6).attr("stroke-width", 2);
        }
        tooltip.style("display", "none");
    });

    // Axes
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

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Sector-Based Trends in Binary Ratings");

    // Legend (checkboxes)
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
                svg.selectAll(`.sector-${d[0].replace(/\s+/g, "-")}`)
                    .transition()
                    .duration(500)
                    .attr("opacity", isChecked ? 0.6 : 0);
            });

        container.append("label")
            .attr("for", `sector-${i}`)
            .style("margin-left", "5px")
            .text(d[0]);
    });

    console.log("Sector-level line chart rendered successfully with fixed hover logic.");
}).catch(error => {
    console.error("Error loading data:", error);
});


d3.json("../data/feature_importance_data_scaled.json").then(flatData => {
    console.log("Feature Importance Data Loaded:", flatData);
    createRadarChartControls(flatData);
}).catch(error => {
    console.error("Error loading feature importance data:", error);
});

function updateRadarChart(flatData, selectedSectors) {
    const topFeatures = [
        "Operating Margin", 
        "EBITDA Margin", 
        "Current Ratio", 
        "Operating Cash Flow Per Share", 
        "Debt/Equity Ratio"
    ];

    const radarWidth = 850;
    const radarHeight = 750;
    const radius = Math.min(radarWidth, radarHeight) / 2 - 90;

    const radarSvg = d3.select("#radarChart")
        .html("")
        .append("svg")
        .attr("width", radarWidth)
        .attr("height", radarHeight)
        .append("g")
        .attr("transform", `translate(${radarWidth / 2},${radarHeight / 2})`);

    const angleScale = d3.scaleLinear()
        .domain([0, topFeatures.length])
        .range([-Math.PI / 2, Math.PI * 1.5]);

    const radialScale = d3.scaleLinear()
        .domain([-2.5, 2.5]) 
        .range([0, radius]);

    // Draw grid
    for (let i = -2.5; i <= 2.5; i += 0.5) {
        radarSvg.append("circle")
            .attr("r", radialScale(i))
            .attr("fill", "none")
            .attr("stroke", "#ddd");

        radarSvg.append("text")
            .attr("y", -radialScale(i) - 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .text(i);
    }

    // Draw axes
    topFeatures.forEach((feature, i) => {
        const angle = angleScale(i);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        radarSvg.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", y)
            .attr("stroke", "#999");

        radarSvg.append("text")
            .attr("x", x * 1.2)
            .attr("y", y * 1.2)
            .attr("text-anchor", x > 0 ? "start" : "end")
            .attr("font-size", "12px")
            .text(feature);
    });

    const radarLine = d3.lineRadial()
        .radius(d => radialScale(d))
        .angle((d, i) => angleScale(i) - Math.PI / 3.343);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(selectedSectors);

    selectedSectors.forEach(sector => {
        const sectorValues = topFeatures.map(feature => {
            const match = flatData.find(d => d.Sector === sector && d.Feature === feature);
            return match ? match.Coefficient : 0;
        });
        sectorValues.push(sectorValues[0]); 

        radarSvg.append("path")
            .datum(sectorValues)
            .attr("d", radarLine)
            .attr("fill", colorScale(sector))
            .attr("fill-opacity", 0.2)
            .attr("stroke", colorScale(sector))
            .attr("stroke-width", 2);

        radarSvg.append("text")
            .attr("x", -radius)
            .attr("y", -radius + 20 + selectedSectors.indexOf(sector) * 15)
            .attr("fill", colorScale(sector))
            .attr("font-size", "14px")
            .text(sector);
    });
}

function createRadarChartControls(flatData) {
    const sectors = [...new Set(flatData.map(d => d.Sector))];
    const controlsDiv = d3.select("#radarChartControls").html("");

    const selectedSectors = ["Business Equipment", "Chemicals", "Durable Goods"];

    sectors.forEach(sector => {
        const container = controlsDiv.append("div").style("margin-right", "10px");

        const checkbox = container.append("input")
            .attr("type", "checkbox")
            .attr("id", `radar-${sector}`)
            .attr("value", sector)
            .property("checked", selectedSectors.includes(sector))  
            .on("change", () => {
                const updatedSelection = [];
                controlsDiv.selectAll("input:checked").each(function () {
                    updatedSelection.push(this.value);
                });
                updateRadarChart(flatData, updatedSelection);
            });

        container.append("label")
            .attr("for", `radar-${sector}`)
            .style("margin-left", "5px")
            .text(sector);
    });

    updateRadarChart(flatData, selectedSectors);
}