// const d3 = require('d3');
// const gsap = require('gsap');

const margin = { top: 20, right: 30, bottom: 50, left: 80 };
let width = parseInt(d3.select(".chart-section").style("width")) - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;

const scatter = d3.select("#scatter-plot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr("id", "scatter-graph")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.json("assets/data/full_data.json").then(data => {
  const parseDate = d3.timeParse("%Y-%m-%d");
  data = data.filter(d => {
    d.release_date = parseDate(d.release_date); 
    d.duration_sec = +d.duration_sec; 
    return d.release_date && !isNaN(d.duration_sec) && d.release_date.getFullYear() >= 2007;
  });

  // Scales lol
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.release_date))
    .range([0, width]);
  const y = d3.scaleLinear()
    .domain([0, 400]).nice()
    .range([height, 0]);

  // Axes
  scatter.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));
  scatter.append("g")
    .call(d3.axisLeft(y));

  // Labels
  scatter.append("text")
    .attr("x", width / 2)
    .attr("class", "graph-label")
    .attr("y", height + margin.bottom - 10)
    .style("text-anchor", "middle")
    .text("Release Date");
  scatter.append("text")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("class", "graph-label")
    .attr("class", "y-label")
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .text("Duration (seconds)");

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("width", "fit-content")
    .style("box-shadow", "rgba(149, 157, 165, 0.2) 0px 8px 24px");

  // Tooltip functions
  const mouseover = function(d) {
    tooltip.style("opacity", 1);
  };

  const mousemove = function(event, d) {
    tooltip
      .html("<span class='tooltip-text'><strong>" + d.artist + "</strong><br>" + d.track + "</span>")
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY + 10) + "px");
  };

  const mouseleave = function() {
    tooltip.style("opacity", 0);
  };

  // Add dots
  scatter.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.release_date))
    .attr("cy", d => y(d.duration_sec))
    .attr("r", 2)
    .style("fill", "#98bad5")
    .style("opacity", 0.5)
    .style("box-shadow", "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px")
    .on("mouseover", function(event, d) {
      d3.select(this).style("fill", "#9ef4fa").attr("r", 5);
      mouseover(d);
    })
    .on("mousemove", mousemove)
    .on("mouseleave", function(event, d) {
      d3.select(this).style("fill", "#98bad5").attr("r", 2);
      mouseleave();
    });

  function agencyfilter(selectedAgency){
    let agencydots = data.filter(d => d.agency == selectedAgency);

    scatter.selectAll(".agencydot")
    .remove();

    scatter.selectAll(".agencydot")
    .data(agencydots)
    .enter().append("circle")
    .attr("class", "agencydot")
    .attr("cx", d => x(d.release_date))
    .attr("cy", d => y(d.duration_sec))
    .attr("r", 2)
    .style("fill", "#ffd92f")
    .attr("z-index", 3)
    .attr("opacity", 0.8)
    .on("mouseover", function(event, d) {
      d3.select(this).style("fill", "orange").attr("r", 5);
      mouseover(d);
    })
    .on("mousemove", mousemove)
    .on("mouseleave", function(event, d) {
      d3.select(this).style("fill", "#ffd92f").attr("r", 2);
      mouseleave();
    });

    window.addEventListener('scroll', () => {
      if (isElementInViewport(overall2014) && bool2014) {
        scatter.selectAll(".agencydot").remove();
      }
    });

  }

  $("#agency-filter").on("change", function () {
    let selected = $(this).val(); 
    agencyfilter(selected);
    agencyCurve(selected);
  });



}).catch(error => console.error("Error loading data:", error));


function agencyCurve(selectedAgency) {
  
  d3.json(`assets/data/${selectedAgency}.json`).then(data => {
    data.forEach(d => {
        d.year = new Date(d.year); // Convert to Date object
    });

    const svg = d3.select("#scatter-plot")
        .select("svg") 
        .select("g"); 
    
    // Scales (same as data)
    const x = d3.scaleTime()
      .domain([2007, 2024])
      .range([0, width]);

    if (selectedAgency === "hybe") {
      const minYear = d3.min(data, d => d.year);
      if (minYear > new Date(2007, 0, 1)) {
        // Add a placeholder point at 2007
        data.unshift({
          year: new Date(2007, 0, 1),
          avg_duration_sec: 0, // or any baseline value
        });
      }
    }

    const y = d3.scaleLinear()
        .domain([0, 400]).nice()
        .range([height, 0]);

    const line = d3.line()
        .curve(d3.curveCardinal.tension(0.2))
        .x(d => x(d.year))  
        .y(d => y(d.avg_duration_sec)); 


    svg.selectAll(".agencycurve")
      .remove();

    let path = svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("class", "agencycurve")
        .attr("z-index", 5)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("stroke", "#fc8d62");

    const length = path.node().getTotalLength(); 
    // Make the line appear wowza
    path.attr("stroke-dasharray", length + " " + length)
        .attr("stroke-dashoffset", length)
          .transition()
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0)
          .duration(1200);

    svg.selectAll(".dots")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dots")
        .attr("class", "agencycurve")
        .attr("z-index", 5)
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.avg_duration_sec))
        .attr("r", 0) 
        .attr("fill", "#fc8d62")
        .style("opacity", 0)
            .transition()
              .duration(400)
              .style("opacity", 1);

    window.addEventListener('scroll', () => {
    if (isElementInViewport(overall2014) && bool2014) {
      svg.selectAll(".agencycurve").remove();
    }

  });
    
  }).catch(error => console.error("Error loading data:", error));

  

}



gsap.registerPlugin(ScrollTrigger); // Plugin for scroll pinning

ScrollTrigger.create({
    trigger: "#scatter-plot", 
    start: "center center",  
    endTrigger: "#next",
    end: "bottom bottom",  
    scrub: true,           
    pin: true,    
    pinSpacing: false,        
    anticipatePin: 1,      
});

const overallCurve = document.querySelector('#overallCurve');
const overall2007 = document.querySelector('#overall2007');
const firstscroll = document.querySelector('#overallFirst');
const intro2014 = document.querySelector('#intro2014')
const overall2014 = document.querySelector('#overall2014');
const exploretab = document.querySelector('#exploretab');

const percent_intro = document.querySelector('#percent_intro');
const percent_first = document.querySelector('#percent_first');
const percent_2020 = document.querySelector('#percent_2020');
const percent_2022 = document.querySelector('#percent_2022')
const percent_2024 = document.querySelector('#percent_2024');

let boolFirst = false;
let bool2007 = false;
let boolCurve = false;
let bool2014 = false;
let boolexplore = false;

let boolPercent = false;
let bool2020 = false;
let bool2022 = false;
let bool2024 = false;

function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
}

const data2007 = { year: new Date(2007, 0, 1), avg_duration_sec: 230.86184};
const data2024 = {year: new Date(2024), avg_duration_sec: 184.0984355231};
const data2014 = {year: new Date(2014, 3, 28), avg_duration_sec: 216.617};


window.addEventListener('scroll', () => {
    if (isElementInViewport(overall2007) && !bool2007) {
        
        overall2007.dataset.visited = true;
        boolFirst = true;
        bool2007 = true;
    
        let svg = d3.select("#scatter-plot")
            .select("svg") 
            .select("g"); 
    
        let x = d3.scaleTime()
            .domain([new Date(2007, 0, 1), new Date(2025, 0, 1)]) 
            .range([0, width]);
    
        let y = d3.scaleLinear()
            .domain([0, 400]).nice()
            .range([height, 0]);
    
        // Add svg dot
        svg.append("circle")
            .attr("cx", x(data2007.year))  
            .attr("cy", y(data2007.avg_duration_sec))  
            .attr("r", 4)  
            .attr("fill", "#527dd9")
            .attr("class", "data2007")
            .attr("z-index", 5)
            .style("opacity", 0)
            .transition() 
              .duration(800)
              .style("opacity", 1)
        
        svg.append("text")
            .attr("x", x(new Date(2007, 0, 1)) + 10) 
            .attr("y", y(230.86184) - 10)
            .style("font-weight", 600)
            .attr("fill", "#527dd9")
            .style("z-index", 5)
            .html("2007")
            .attr("class", "data2007")
            .style("opacity", 0)
            .transition() 
              .duration(800)
              .style("opacity", 1); 
    }


    if (isElementInViewport(firstscroll) && bool2007) {
      bool2007 = false;
      let svg = d3.select("#scatter-plot")
            .select("svg") 
            .select("g");
      svg.selectAll('.data2007')
        .transition() 
        .duration(300)
        .style("opacity", 0)
        .remove();
    }

    if (isElementInViewport(overall2007) && boolCurve) {
      boolCurve = false;
      let svg = d3.select("#scatter-plot")
            .select("svg") 
            .select("g");
      svg.selectAll('.data2024')
        .transition() 
        .duration(300)
        .style("opacity", 0)
        .remove();
    }

    if (isElementInViewport(overallCurve) && !boolCurve) {
        
        firstscroll.dataset.visited = false;
        boolCurve = true;
        d3.json("assets/data/avg_duration_year_0.json").then(data => {
            data.forEach(d => {
                d.year = new Date(d.year); // Convert to Date object
            });
        
            const svg = d3.select("#scatter-plot")
                .select("svg") 
                .select("g"); 
        
            // Scales (same as data)
            const x = d3.scaleTime()
                .domain(d3.extent(data, d => d.year)) 
                .range([0, width]);
        
            const y = d3.scaleLinear()
                .domain([0, 400]).nice()
                .range([height, 0]);
        
            const line = d3.line()
                .curve(d3.curveCardinal.tension(0.2))
                .x(d => x(d.year))  
                .y(d => y(d.avg_duration_sec)); 

        
            let path = svg.append("path")
                .data([data])
                .attr("class", "line")
                .attr("class", "data2024")
                .attr("z-index", 5)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke-width", 2)
                .attr("stroke", "#527dd9") 
                .attr("class", "data2024");

            const length = path.node().getTotalLength(); 
            // Make the line appear wowza
            path.attr("stroke-dasharray", length + " " + length)
                .attr("stroke-dashoffset", length)
                  .transition()
                  .ease(d3.easeLinear)
                  .attr("stroke-dashoffset", 0)
                  .duration(1200);
        
            svg.selectAll(".dot")
                .data(data)
                .enter()
                .append("circle")
                .attr("class", "dot")
                .attr("class", "data2024")
                .attr("z-index", 5)
                .attr("cx", d => x(d.year))
                .attr("cy", d => y(d.avg_duration_sec))
                .attr("r", 4) 
                .attr("fill", "#527dd9")
                .attr("class", "data2024");

            // Add dots to the line
            svg.append("circle")
                .attr("cx", x(data2024.year))  
                .attr("cy", y(data2024.avg_duration_sec))  
                .attr("r", 4)  
                .attr("fill", "#527dd9")
                .attr("z-index", 5)
                .attr("class", "data2024")
                .style("opacity", 0)
                .transition() 
                  .duration(800)
                  .style("opacity", 1);

            // Add avg dot
            svg.append("text")
                .attr("x", x(new Date(2024)) -20) 
                .attr("y", y(184.0984355231) - 10)
                .style("font-weight", 600)
                .attr("fill", "#527dd9")
                .attr("z-index", 5)
                .attr("class", "data2024")
                .html("2024")
                .style("opacity", 0)
                .transition() 
                  .duration(800)
                  .style("opacity", 1); 
            
        }).catch(error => console.error("Error loading data:", error));       
    }

    if (isElementInViewport(intro2014) && bool2014) {
      bool2014 = false;
      let svg = d3.select("#scatter-plot")
            .select("svg") 
            .select("g");
      svg.selectAll('.data2014')
        .transition() 
        .duration(300)
        .style("opacity", 0)
        .remove();
    }
    
    if (isElementInViewport(overall2014) && !bool2014) {
        bool2014 = true;
        let svg = d3.select("#scatter-plot")
            .select("svg") 
            .select("g"); 
    
        // Scales
        let x = d3.scaleTime()
            .domain([new Date(2007, 0, 1), new Date(2025, 0, 1)]) 
            .range([0, width]);
    
        let y = d3.scaleLinear()
            .domain([0, 400]).nice()
            .range([height, 0]);
    
        // Add avg dot
        svg.append("circle")
        .attr("cx", x(data2014.year))  
        .attr("cy", y(data2014.avg_duration_sec))  
        .attr("r", 4)  
        .attr("fill", "#527dd9")
        .attr("class", "data2014")
        .attr("z-index", 5)
        .style("opacity", 0)
        .transition() 
            .duration(800)
            .style("opacity", 1);
        
        svg.append("text")
        .attr("x", x(new Date(2014, 0, 1)) + 10) 
        .attr("y", y(216.617894) - 10)
        .style("font-weight", 600)
        .attr("fill", "#527dd9")
        .style("z-index", 5)
        .html("2014")
        .attr("class", "data2014")
        .style("opacity", 0)
        .transition() 
          .duration(800)
          .style("opacity", 1); 
    }

    if (isElementInViewport(overall2014) && boolexplore) {
      boolexplore = false;
      document.getElementById("chart-filter").classList.remove("visible");
    }

    if (isElementInViewport(exploretab) && !boolexplore) {
      boolexplore = true;
      document.getElementById("chart-filter").classList.add("visible");
    }

});



const percent = d3.select("#percent-curve")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr("id", "percent-graph")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

ScrollTrigger.create({
    trigger: "#percent-graph", 
    start: "center center",  
    endTrigger: "#next2",
    end: "bottom bottom",  
    scrub: true,           
    pin: true,    
    pinSpacing: false,        
    anticipatePin: 1,      
});


d3.json("assets/data/percentage.json").then(data => {
    data.forEach(d => {
        d.year = parseInt(d.year); 
    });

    const x = d3.scaleTime()
        .domain([2007, 2024])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, 50]).nice()
        .range([height, 0]);

    const line = d3.line()
    .curve(d3.curveCardinal.tension(0.2))
        .x(d => x(d.year))
        .y(d => y(d.percentage));

    // Add axes
    percent.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        percent.append("g")
        .call(d3.axisLeft(y));

    // Add axis labels
    percent.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("class", "graph-label")
        .style("text-anchor", "middle")
        .text("Year");

    percent.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("class", "graph-label")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .text("Portion (%)");

    // Adding tooltips!
    const tooltip = d3.select("body")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("width", "fit-content")
        .style("box-shadow", "rgba(149, 157, 165, 0.2) 0px 8px 24px");
    
      // Tooltip functions
    const mouseover = function(d) {
        tooltip.style("opacity", 1);
    };
    
    const mousemove = function(event, d) {
        tooltip
          .html("<span class='tooltip-text'>In <strong>" + d.year + "</strong>, " + parseFloat(d.percentage).toFixed(1) + "% of songs<br>were under 3 minutes long.</span>")
          .style("left", (event.pageX - 70) + "px")
          .style("top", (event.pageY - 60) + "px");
    };

    const mouseleave = function() {
      tooltip.style("opacity", 0);
    };

  
    window.addEventListener('scroll', () => {
      if (isElementInViewport(percent_first) && !boolPercent) {
        boolPercent = true;
        const curve2018 = data.filter(d => d.year <= 2018);

        let path = percent.append("path")
          .data([curve2018])
          .attr("class", "line")
          .attr("class", "firstpercent")
          .attr("d", line)
          .attr("fill", "none")
          .attr("stroke-width", 2)
          .attr("stroke", "#fa9ebc") 

        const length = path.node().getTotalLength(); 

        path.attr("stroke-dasharray", length + " " + length)
              .attr("stroke-dashoffset", length)
                .transition()
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
                .duration(1200);

        percent.selectAll(".dot2018")
                .data(curve2018)
                .enter()
                .append("circle")
                .attr("class", "dot2018")
                .attr("class", "firstpercent")
                .attr("cx", d => x(d.year))
                .attr("cy", d => y(d.percentage))
                .attr("r", 4) 
                .attr("fill", "#fa9ebc")
                .style("opacity", 0)
                .transition() 
                  .duration(1200)
                  .style("opacity", 1);
      }

      if (isElementInViewport(percent_intro) && boolPercent) {
        boolPercent = false;
        percent.selectAll('.firstpercent')
          .transition() 
          .duration(300)
          .style("opacity", 0)
          .remove();
      }

      if (isElementInViewport(percent_first) && bool2020) {
        bool2020 = false;
        percent.selectAll('.curve2020')
          .transition() 
          .duration(300)
          .style("opacity", 0)
          .remove();
      }

      if (isElementInViewport(percent_2020) && !bool2020) {
        bool2020 = true;
        const curve2020 = data.filter(d => d.year >= 2018 && d.year <= 2020);

        let path = percent.append("path")
          .data([curve2020])
          .attr("class", "line")
          .attr("class", "curve2020")
          .attr("d", line)
          .attr("fill", "none")
          .attr("stroke-width", 2)
          .attr("stroke", "#fa9ebc") 

        const length = path.node().getTotalLength(); 

        path.attr("stroke-dasharray", length + " " + length)
              .attr("stroke-dashoffset", length)
                .transition()
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
                .duration(800);

        percent.selectAll(".dot2020")
                .data(curve2020)
                .enter()
                .append("circle")
                .attr("class", "dot2020")
                .attr("class", "curve2020")
                .attr("cx", d => x(d.year))
                .attr("cy", d => y(d.percentage))
                .attr("r", 4) 
                .attr("fill", "#fa9ebc")
                .style("opacity", 0)
                .transition() 
                  .duration(800)
                  .style("opacity", 1);

      }

      if (isElementInViewport(percent_2020) && bool2022) {
        bool2022 = false;
        percent.selectAll('.curve2022')
          .transition() 
          .duration(300)
          .style("opacity", 0)
          .remove();
      }

      if (isElementInViewport(percent_2022) && !bool2022) {
        
        bool2022 = true;

        const curve2022 = data.filter(d => d.year >= 2020 && d.year <= 2022);

        let path = percent.append("path")
          .data([curve2022])
          .attr("class", "line")
          .attr("class", "curve2022")
          .attr("d", line)
          .attr("fill", "none")
          .attr("stroke-width", 2)
          .attr("stroke", "#fa9ebc") 

        const length = path.node().getTotalLength(); 

        path.attr("stroke-dasharray", length + " " + length)
              .attr("stroke-dashoffset", length)
                .transition()
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
                .duration(800);

        percent.selectAll(".dot2022")
                .data(curve2022)
                .enter()
                .append("circle")
                .attr("class", "dot2022")
                .attr("class", "curve2022")
                .attr("cx", d => x(d.year))
                .attr("cy", d => y(d.percentage))
                .attr("r", 4) 
                .attr("fill", "#fa9ebc")
                .style("opacity", 0)
                .transition() 
                  .duration(800)
                  .style("opacity", 1);

      }

      if (isElementInViewport(percent_2022) && bool2024) {
        bool2024 = false;
        percent.selectAll('.curve2024')
          .transition() 
          .duration(300)
          .style("opacity", 0)
          .remove();

        percent.selectAll('.dot')
          .transition() 
          .duration(300)
          .style("opacity", 0)
          .remove();
      }

      if (isElementInViewport(percent_2024) && !bool2024) {
        
        bool2024 = true;

        const curve2024 = data.filter(d => d.year >= 2022 && d.year <= 2024);

        let path = percent.append("path")
          .data([curve2024])
          .attr("class", "line")
          .attr("class", "curve2024")
          .attr("d", line)
          .attr("fill", "none")
          .attr("stroke-width", 2)
          .attr("stroke", "#fa9ebc") 

        const length = path.node().getTotalLength(); 

        path.attr("stroke-dasharray", length + " " + length)
              .attr("stroke-dashoffset", length)
                .transition()
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
                .duration(800);

        percent.selectAll(".dot2024")
                .data(curve2024)
                .enter()
                .append("circle")
                .attr("class", "dot2024")
                .attr("class", "curve2024")
                .attr("cx", d => x(d.year))
                .attr("cy", d => y(d.percentage))
                .attr("r", 4) 
                .attr("fill", "#fa9ebc")
                .style("opacity", 0)
                .transition() 
                  .duration(800)
                  .style("opacity", 1);

        percent.selectAll(".dot")
          .data(data)
          .enter()
          .append("circle")
                .attr("class", "dot2018")
                .attr("class", "dot")
                .attr("cx", d => x(d.year))
                .attr("cy", d => y(d.percentage))
                .attr("r", 4) 
                .attr("fill", "#fa9ebc")
                .style("z-index", 2)
                .style("opacity", 0.3)
          .on("mouseover", function(event, d) {
            d3.select(this).style("fill", "#9ef4fa").attr("r", 5);
            mouseover(d);
          })
          .on("mousemove", mousemove)
          .on("mouseleave", function(event, d) {
            d3.select(this).style("fill", "#fa9ebc").attr("r", 4);
            mouseleave()});
      }

    
    });

  
    
}).catch(error => console.error("Error loading data:", error));


const groupGraph = d3.select("#groupyearcharts")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr("id", "group-graph")
  .append("g")
.attr("transform", `translate(${margin.left},${margin.top})`);


  
function createTimeGraph(timedata) {

  timedata.forEach(d => {
    d.current_avg = isNaN(d.current_avg) ? 0 : d.current_avg;
  });

  var x = d3.scaleBand()
  .range([0, width])
  .domain(timedata.map(function(d) { return d.year; }))
  .padding(0.2);

  groupGraph.select(".x-axis").remove();
  groupGraph.select(".y-axis").remove();

  groupGraph.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "x-axis")
    .call(d3.axisBottom(x))
    .selectAll("text")
      .style("text-anchor", "end");

  var y = d3.scaleLinear()
    .domain([0, 300])
    .range([height, 0]);
  groupGraph.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));
    
  groupGraph.selectAll(".graph-label").remove();
  groupGraph.selectAll(".y-label").remove();

  groupGraph.append("text")
    .attr("x", width / 2)
    .attr("class", "graph-label")
    .attr("y", height + margin.bottom - 10)
    .style("text-anchor", "middle")
    .text("Year");

  groupGraph.append("text")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("class", "graph-label")
    .attr("class", "y-label")
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .text("Duration (seconds)");


  var bars = groupGraph.selectAll("rect")
    .data(timedata);

    // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("width", "fit-content")
    .style("box-shadow", "rgba(149, 157, 165, 0.2) 0px 8px 24px");

  // Tooltip functions
  const mouseover = function(d) {
    tooltip.style("opacity", 1);
  };

  const mousemove = function(event, d) {
    tooltip
      .html("<span class='tooltip-text'><strong>" + d.year + "</strong><br>" + d.current_avg + " seconds</span>")
      .style("left", (event.pageX - 40) + "px")
      .style("top", (event.pageY - 65) + "px");
  };

  const mouseleave = function() {
    tooltip.style("opacity", 0);
  };

  var defs = groupGraph.append("defs");

  var gradient = defs.append("linearGradient")
    .attr("id", "bar-gradient")
    .attr("x1", "0%")
    .attr("x2", "0%")
    .attr("y1", "0%")
    .attr("y2", "100%");

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#8da0cb")
    .attr("stop-opacity", 1);

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#bebada")
    .attr("stop-opacity", 1);


  bars.exit()
    .transition()
    .duration(500)
    .attr("height", 0)
    .attr("y", height)
    .remove();

  bars.transition()
    .duration(800)
    .attr("x", function(d) { return x(d.year); })
    .attr("y", function(d) { return y(d.current_avg); })
    .attr("width", x.bandwidth())
    .attr("height", function(d) { return height - y(d.current_avg); })
    .attr("fill", "url(#bar-gradient)");

  bars.enter()
    .append("rect")
    .attr("x", function(d) { return x(d.year); })
    .attr("width", x.bandwidth())
    .attr("fill", "url(#bar-gradient)")
    .attr("y", height)
    .attr("height", 0)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill", "#fa9ebc");
      mouseover(d);
    })
    .on("mousemove", mousemove)
    .on("mouseout", function(event, d) {
      d3.select(this).attr("fill", "url(#bar-gradient)");
      mouseleave();
    })
    .transition()
    .duration(800)
    .attr("y", function(d) { return y(d.current_avg); })
    .attr("height", function(d) { return height - y(d.current_avg); });  


    
}

function getArtistData(selectedArtist) {
  d3.json("assets/data/full_data.json").then(data => {

    const overallAvg = parseInt(d3.mean(data, d => d.duration_sec));
    const overallMin = Math.floor(overallAvg/60);
    const overallSec = overallAvg % 60;

    data = data.filter(d => { 
      return d.artist == selectedArtist;
    });

    let total_avg = parseInt(d3.mean(data, d => d.duration_sec));
    let length_indicator = "";

    if (total_avg > overallAvg) {
      length_indicator = "longer than";
    } else if (total_avg < overallAvg) {
      length_indicator = "shorter than";
    } else {
      length_indicator = "right in";
    }

    let avg_minutes = Math.floor(total_avg/60);
    let avg_seconds = total_avg % 60;
    
    let debut_year;

    if (selectedArtist == "NEXZ" || selectedArtist == "NCT WISH" ) {
      debut_year = 2024;
    } else {
      debut_year = parseInt(d3.min(data, d => new Date(d.release_date).getFullYear()));
    }

    let debut_data = data.filter(d => new Date(d.release_date).getFullYear() === debut_year);
    let debut_avg = parseInt(d3.mean(debut_data, d => d.duration_sec));
    let debut_minutes = Math.floor(debut_avg/60);
    let debut_seconds = debut_avg % 60;

    let today = parseInt(d3.max(data, d => new Date(d.release_date).getFullYear()));

    let today_data = data.filter(d => new Date(d.release_date).getFullYear() === today);
    let today_avg = parseInt(d3.mean(today_data, d => d.duration_sec));
    let today_minutes = Math.floor(today_avg/60);
    let today_seconds = today_avg % 60;

    let debut_comparison;
    if (debut_year == 2024 || debut_year == today) {
      debut_comparison = false;
    } else {
      debut_comparison = true;
    }

    let timedata = [];

    for (let year = debut_year; year <= today; year++) {
      let current_data = data.filter(d => new Date(d.release_date).getFullYear() === year);
      let current_avg = parseInt(d3.mean(current_data, d => d.duration_sec));
      let current = {year, current_avg};
      timedata.push(current);
    }

    if (selectedArtist == "TVXQ") {
      debut_year = 2003;
    } else if (selectedArtist == "BLACKPINK") {
      debut_year = 2016;
    }

    let change_indicator;

    let diff_seconds = parseInt(Math.abs(today_avg - debut_avg));
    let change_percent = parseFloat(diff_seconds/debut_avg * 100.0).toFixed(1);

    document.getElementById("overallMin").innerHTML = overallMin;
    document.getElementById("overallSec").innerHTML = overallSec;
    document.getElementById("total_avg").innerHTML = total_avg;
    document.getElementById("avg_minutes").innerHTML = avg_minutes;
    document.getElementById("avg_seconds").innerHTML = avg_seconds;
    document.getElementById("length_indicator").innerHTML = length_indicator;
    document.getElementById("debut_year").innerHTML = debut_year;
    if (debut_comparison) {
      if (document.getElementById("debut_comparison").style.display = 'none'){
        document.getElementById("debut_comparison").style.display = 'block'
        document.getElementById("groupyearcharts").style.display = 'block';
        document.getElementById("missingdata").style.display = 'block';
      }
      document.getElementById("debut_minutes").innerHTML = debut_minutes;
      document.getElementById("debut_seconds").innerHTML = debut_seconds;
      document.getElementById("today_minutes").innerHTML = today_minutes;
      document.getElementById("today_seconds").innerHTML = today_seconds;
      document.getElementById("today").innerHTML = today;
      if (today_avg > debut_avg && diff_seconds >= 2) {
        if (document.getElementById("change_sentence").style.display = 'none'){
          document.getElementById("change_sentence").style.display = 'inline'
        }
        change_indicator = "increase";
        document.getElementById("change_indicator").innerHTML = change_indicator;
        document.getElementById("diff_seconds").innerHTML = diff_seconds;
        document.getElementById("change_percent").innerHTML = change_percent;
      } else if (today_avg < debut_avg && diff_seconds >= 2) {
        if (document.getElementById("change_sentence").style.display = 'none'){
          document.getElementById("change_sentence").style.display = 'inline'
        }
        change_indicator = "decrease";
        document.getElementById("change_indicator").innerHTML = change_indicator;
        document.getElementById("diff_seconds").innerHTML = diff_seconds;
        document.getElementById("change_percent").innerHTML = change_percent;
      } else {
        document.getElementById("change_sentence").style.display = 'none';
      }
      createTimeGraph(timedata);
    } else {
      document.getElementById("debut_comparison").style.display = 'none';
      document.getElementById("groupyearcharts").style.display = 'none';
      document.getElementById("missingdata").style.display = 'none';
    }

    let agency = data[0].agency;

    if (agency == "other") {
      if (document.getElementById("sameagency-highlights").style.display = "block") {
        document.getElementById("sameagency-highlights").style.display = "none"
      }
      document.getElementById("agency-info").style.display = "block";

      $("#agency-select").on("change", function () {
        let selected = $(this).val(); 
        getAgencyData(selected);
        $('#agency-highlights').fadeIn();
        $('html, body').animate({
          scrollTop: $("#agency-highlights").offset().top - 70
        }, 800);
      });

    } else {
      getSameAgencyData(agency, total_avg);
      document.getElementById("sameagency-highlights").style.display = "block";
      if (document.getElementById("agency-info").style.display = "block") {
        document.getElementById("agency-info").style.display = "none"
      }
      if (document.getElementById("agency-highlights").style.display = "block") {
        document.getElementById("agency-highlights").style.display = "none"
      }
    }




  }).catch(error => console.error("Error loading data:", error));
}

var sameAgencyGraph = d3.select("#sameAgencychart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", 380)
  .attr("id", "sameagency-graph")
  .append("g")
.attr("transform", `translate(${margin.left},${margin.top})`);

var agencyChart = d3.select("#agencyChart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", 380)
  .attr("id", "agency-graph")
  .append("g")
.attr("transform", `translate(${margin.left},${margin.top})`);

function createAgencyChart(selectedAgency, selectedChart) {

  d3.json(`assets/data/full_data.json`).then(data => {

    data = data.filter(d => { 
      return d.agency == selectedAgency;
    });

    var datapergroup = d3.group(data, d => d.artist);
    let averages = [];
    
    datapergroup.forEach((values, artist) => {
      let group_avg = parseInt(d3.mean(values, d => d.duration_sec));
      averages.push({ artist: artist, group_avg: group_avg });
    });

    // Scales
    var x = d3.scaleLinear()
      .range([margin.left, width - margin.right])
      .domain([0, d3.max(averages, d => d.group_avg)]);

    var y = d3.scaleBand()
      .domain(d3.sort(averages, d => -d.group_avg).map(d => d.artist))
      .rangeRound([margin.top, 380 - margin.bottom])
      .padding(0.1);

    // Axes
    selectedChart.select(".x-axis").remove();
    selectedChart.select(".y-axis").remove();
    selectedChart.select("defs").remove();

    selectedChart.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${margin.top})`)
      .call(d3.axisTop(x).ticks(5).tickFormat(d => `${d} sec`));

    selectedChart.append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y));

    // Tooltip setup
    const tooltip = d3.select("body").append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border-radius", "5px")
      .style("padding", "5px");

    // Tooltip functions
    const mouseover = () => tooltip.style("opacity", 1);
    const mousemove = (event, d) => tooltip
      .html(`<span class='tooltip-text'><strong>${d.artist}</strong><br>${d.group_avg} seconds</span>`)
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY + 10}px`);
    const mouseleave = () => tooltip.style("opacity", 0);

    
    var defs = selectedChart.append("defs");
    var gradient = defs.append("linearGradient")
      .attr("id", "rect-gradient")
      .attr("x1", "0%") 
      .attr("x2", "100%") 
      .attr("y1", "0%") 
      .attr("y2", "0%");
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#8da0cb");
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#bebada");

    
    var bars = selectedChart.selectAll("rect").data(averages);

    bars.exit().transition().duration(500).attr("width", 0).remove();

    bars.enter()
      .append("rect")
      .merge(bars)
      .attr("class", "bar")
      .attr("x", margin.left)
      .attr("y", d => y(d.artist))
      .attr("width", d => x(d.group_avg) - margin.left)
      .attr("height", y.bandwidth())
      .attr("fill", "url(#rect-gradient)")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", "#fa9ebc");
        mouseover(d);
      })
      .on("mousemove", mousemove)
      .on("mouseout", function(event, d) {
        d3.select(this).attr("fill", "url(#rect-gradient)");
        mouseleave();
      })
      .transition()
      .duration(800);

  }).catch(error => console.error("Error loading data:", error));

}


function getSameAgencyData(selectedAgency, groupavg) {
  d3.json("assets/data/full_data.json").then(data => {

    data = data.filter(d => { 
      return d.agency == selectedAgency;
    });

    let agency_name;

    switch (selectedAgency) {
      case "sm":
        agency_name = "SM Entertainment";
        break;
      case "jyp":
        agency_name = "JYP Entertainment";
        break;
      case "yg":
        agency_name = "YG Entertainment";
        break;
      case "hybe":
        agency_name = "HYBE";
        break;
      default:
        agency_name = "Unknown Agency";
    }

    let total_avg = parseInt(d3.mean(data, d => d.duration_sec));
    let avg_minutes = Math.floor(total_avg/60);
    let avg_seconds = total_avg % 60;

    let group_indicator;

    if (groupavg > total_avg) {
      group_indicator = "longer than";
    } else if (groupavg < total_avg) {
      group_indicator = "shorter than";
    } else {
      group_indicator = "the same as";
    }

    let agency_2007 = data.filter(d => new Date(d.release_date).getFullYear() === 2007);
    let avg_2007 = parseInt(d3.mean(agency_2007, d => d.duration_sec));
    let minutes_2007 = Math.floor(avg_2007/60);
    let seconds_2007 = avg_2007 % 60;

    let agency_2014 = data.filter(d => new Date(d.release_date).getFullYear() === 2014);
    let avg_2014 = parseInt(d3.mean(agency_2014, d => d.duration_sec));
    let minutes_2014 = Math.floor(avg_2014/60);
    let seconds_2014 = avg_2014 % 60;

    let agency_2024 = data.filter(d => new Date(d.release_date).getFullYear() === 2024);
    let avg_2024 = parseInt(d3.mean(agency_2024, d => d.duration_sec));
    let minutes_2024 = Math.floor(avg_2024/60);
    let seconds_2024 = avg_2024 % 60;

    let diff_2007 = parseInt(Math.abs(avg_2024 - avg_2007));
    let diff_2014 = parseInt(Math.abs(avg_2024 - avg_2014));

    $(".agency-name").each(function () {
      $(this).text(agency_name); 
    });
    document.getElementById("agency_minutes").innerHTML = avg_minutes;
    document.getElementById("agency_seconds").innerHTML = avg_seconds;
    document.getElementById("group_indicator").innerHTML = group_indicator;

    if (selectedAgency == "hybe") {
      document.getElementById("sentence_2007").style.display = "none";
    } else {
      if (document.getElementById("sentence_2007").style.display = 'none'){
        document.getElementById("sentence_2007").style.display = 'inline'
      }
      document.getElementById("minutes_2007").innerHTML = minutes_2007;
      document.getElementById("seconds_2007").innerHTML = seconds_2007;
      document.getElementById("diff_2007").innerHTML = diff_2007;
    }

    document.getElementById("minutes_2014").innerHTML = minutes_2014;
    document.getElementById("seconds_2014").innerHTML = seconds_2014;
    document.getElementById("diff_2014").innerHTML = diff_2014;

    document.getElementById("minutes_2024").innerHTML = minutes_2024;
    document.getElementById("seconds_2024").innerHTML = seconds_2024;

    createAgencyChart(selectedAgency, sameAgencyGraph);

    triggerOutro();
    
  }).catch(error => console.error("Error loading data:", error));

}

function getAgencyData(selectedAgency) {
  d3.json("assets/data/full_data.json").then(data => {

    data = data.filter(d => { 
      return d.agency == selectedAgency;
    });

    let agency_name;

    switch(selectedAgency) {
      case "sm": agency_name = "SM Entertainment"; break;
      case "jyp": agency_name = "JYP Entertainment"; break;
      case "yg": agency_name = "YG Entertainment"; break;
      case "hybe": agency_name = "HYBE"; break;
    }

    let total_avg = parseInt(d3.mean(data, d => d.duration_sec));
    let avg_minutes = Math.floor(total_avg/60);
    let avg_seconds = total_avg % 60;

    let agency_2007 = data.filter(d => new Date(d.release_date).getFullYear() === 2007);
    let avg_2007 = parseInt(d3.mean(agency_2007, d => d.duration_sec));
    let minutes_2007 = Math.floor(avg_2007/60);
    let seconds_2007 = avg_2007 % 60;

    let agency_2014 = data.filter(d => new Date(d.release_date).getFullYear() === 2014);
    let avg_2014 = parseInt(d3.mean(agency_2014, d => d.duration_sec));
    let minutes_2014 = Math.floor(avg_2014/60);
    let seconds_2014 = avg_2014 % 60;

    let agency_2024 = data.filter(d => new Date(d.release_date).getFullYear() === 2024);
    let avg_2024 = parseInt(d3.mean(agency_2024, d => d.duration_sec));
    let minutes_2024 = Math.floor(avg_2024/60);
    let seconds_2024 = avg_2024 % 60;

    let diff_2007 = parseInt(Math.abs(avg_2024 - avg_2007));
    let diff_2014 = parseInt(Math.abs(avg_2024 - avg_2014));

    $(".agency-name").each(function () {
      $(this).text(agency_name); 
    });
    document.getElementById("agcy_minutes").innerHTML = avg_minutes;
    document.getElementById("agcy_seconds").innerHTML = avg_seconds;

    if (selectedAgency == "hybe") {
      document.getElementById("stnc_2007").style.display = "none";
    } else {
      if (document.getElementById("stnc_2007").style.display = 'none'){
        document.getElementById("stnc_2007").style.display = 'inline'
      }
      document.getElementById("mnts_2007").innerHTML = minutes_2007;
      document.getElementById("scds_2007").innerHTML = seconds_2007;
      document.getElementById("diff2007").innerHTML = diff_2007;
    }

    document.getElementById("mnts_2014").innerHTML = minutes_2014;
    document.getElementById("scds_2014").innerHTML = seconds_2014;
    document.getElementById("diff2014").innerHTML = diff_2014;

    document.getElementById("mnts_2024").innerHTML = minutes_2024;
    document.getElementById("scds_2024").innerHTML = seconds_2024;

    createAgencyChart(selectedAgency, agencyChart);
    
    triggerOutro();
    
  }).catch(error => console.error("Error loading data:", error));

}

// don't delete pls
let boolsupershy = false;
let boolchkchkboom = false;
let booltempo = false;
let previous;

$(document).ready(function(){
  
    let artists = ["NCT 127", "NCT DREAM", "NCT WISH", "NCT DOJAEJUNG", "WayV", "Brown Eyed Girls", "KARA", "F.T. Island", "4MINUTE", "BEAST", "CNBLUE", "SISTAR", "TEEN TOP", "Apink", "B1A4", "Boyfriend", "Block B", "B.A.P", "EXID", "BTOB", "VIXX", "AOA", "MAMAMOO", "GFRIEND", "MONSTA X", "OH MY GIRL", "N.Flying", "ONEWE", "ASTRO", "WJSN", "I.O.I", "SF9", "LOONA", "PENTAGON", "KARD", "Dreamcatcher", "HIGHLIGHT", "ONF", "Wanna One", "Weki Meki", "Golden Child", "THE BOYZ", "(G)I\u2010DLE", "ONEUS", "ATEEZ", "IZ*ONE", "AB6IX", "CIX", "Cravity", "Weeekly", "P1Harmony", "PURPLE KISS", "IVE", "Kep1er", "Xikers", "ZEROBASEONE", "TVXQ", "SUPER JUNIOR", "Girls' Generation", "SHINee", "EXO", "Red Velvet", "aespa", "RIIZE", "2PM", "GOT7", "DAY6", "TWICE", "Stray Kids", "ITZY", "NiziU", "NMIXX", "Xdinary Heroes", "NEXZ", "Miss A", "Wonder Girls", "BTS", "TOMORROW X TOGETHER", "ENHYPEN", "ILLIT", "LE SSERAFIM", "SEVENTEEN", "BOYNEXTDOOR", "New Jeans", "TWS", "NU'EST", "2NE1", "BIGBANG", "AKMU", "WINNER", "BLACKPINK", "TREASURE", "BABYMONSTER", "iKON", "INFINITE"];

    artists.sort();

    var dropdown = $("#group-select");
    $(artists).each(function () {
        var option = $("<option />");
        option.html(this);
        option.val(this);
        dropdown.append(option);
    });

    var groupfilter = $("#group-filter");
    $(artists).each(function () {
        var option = $("<option />");
        option.html(this);
        option.val(this);
        groupfilter.append(option);
    });

    dropdown.on("change", function () {
        let selected = $(this).val(); 
        $(".group-name").each(function () {
            $(this).text(selected); 
        });
        getArtistData(selected);
        $('#group-highlights').fadeIn();
        $('html, body').animate({
          scrollTop: $("#group-highlights").offset().top - 70
        }, 800);
        
    });

    let groupbuttons = $(".resume-group");
    groupbuttons.on("click", function() {
      $('html, body').animate({
        scrollTop: $("#group-pick").offset().top - 70
      }, 800);
    });

});


const example_songs = [{"name": "chk chk boom", "verse1": 37, "prechorus1": 9, "chorus1": 19, "verse2": 29, "prechorus2": 9, "chorus2": 19, "outro": 26 }, {"name": "super shy", "chorus1": 38, "verse2": 13, "prechorus2": 13, "chorus2": 25, "verse3": 13, "chorus3": 25, "outro2": 28}, {"name": "tempo", "intro1": 16, "chorus5": 17, "postchorus1": 8, "verse4": 17, "prechorus3": 16, "chorus6": 17, "postchorus2": 8, "verse5": 17, "prechorus4": 16, "outro3": 70, "chorus7": 22}];

const keys = Array.from(
  new Set(
    example_songs.flatMap(song => Object.keys(song).filter(k => k !== "name"))
  )
);


const trackBox = d3.select("#track");
let widthSong = "100%";

const baseNames = keys.reduce((acc, key) => {
  const base = key.replace(/\d+$/, "");
  if (!acc[base]) acc[base] = [];
  acc[base].push(key);
  return acc;
}, {});

const color = d3.scaleOrdinal()
  .domain(Object.keys(baseNames))
  .range(d3.schemeSet2);

const stack = d3.stack().keys(keys)(example_songs);

const xScale = d3.scaleLinear()
  .domain([0, d3.max(example_songs, d => d3.sum(keys.map(k => d[k] || 0)))])
  .range([0, width - margin.left - margin.right]);

const yScale = d3.scaleBand()
  .domain(example_songs.map(d => d.name))
  .range([0, height - margin.top - margin.bottom])
  .padding(0.1);

const trackGraph = trackBox.append("svg")
  .attr("width", widthSong)
  .attr("height", 30)
  .attr("id", "track-graph");

const chart = trackGraph.append("g");


// Song drawing function for last graph
function drawChart(song, offset) {
  chart.selectAll("*").remove();

  const stackData = keys.map(key => ({ key, value: song[key] || 0 }));
  const total = d3.sum(stackData, d => d.value);

  let xOffset = 0;
  const rects = chart.selectAll("rect");
  rects.data(stackData)
    .enter().append("rect")
    .attr("x", d => {
      const start = xOffset;
      xOffset += (d.value / total) * offset;
      return start;
    })
    .attr("y", 0)
    .attr("width", d => (d.value / total) * (100) + "%")
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", d => color(d.key.replace(/\d+$/, "")));

  rects.exit()
  .transition()
  // .duration(800)
  .attr("opacity", 0)
  .remove();

  // Update existing bars
  rects.transition()
    // .duration(800)
    .attr("x", function (d, i) {
      const prev = d3.sum(stackData.slice(0, i), d => (d.value / total) * (100) + "%");
      return prev;
    })
    .attr("width", d => (d.value / total) * (100) + "%")
    .attr("fill", d => color(d.key.replace(/\d+$/, "")))
    .attr("opacity", 0);

  // Enter new bars
  rects.enter().append("rect")
    .attr("x", function (d, i) {
      const prev = d3.sum(stackData.slice(0, i), d => (d.value / total) * (100) + "%");
      return prev;
    })
    .attr("y", 0)
    .attr("data-name", d => d.key)
    .attr("height", height - margin.top - margin.bottom)
    .attr("width", d => (d.value / total) * (100) + "%")
    .attr("fill", d => color(d.key.replace(/\d+$/, ""))
    )
    .attr("opacity", 0) 
    .transition()
    .duration(2000)
    .attr("opacity", 1);
}

// don't delete LOL
const supershy = document.querySelector('#supershy');
const chkchkboom = document.querySelector('#chkchkboom');
const tempo = document.querySelector('#tempo');

let songtrigger;

function triggerOutro(){

  $("#outro").fadeIn();

    $(document).ready(function() {
      var $chartContainer = $("#player02");
      var $endTrack = $("#end-track");
      if (songtrigger) {
        songtrigger.kill();
      }
      
      songtrigger = ScrollTrigger.create({
        trigger: $chartContainer[0],
        start: "center center",
        endTrigger: $endTrack[0],
        end: "bottom bottom",
        scrub: true,
        pin: true, 
        pinSpacing: false,
        opacity : 1,
        // markers: true,
        invalidateOnRefresh: true,
        // pinReparent: true,
        anticipatePin: 1         
      });
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
    });

    var timetime = document.querySelector('#track')
    let widthSvg = $(timetime).width();

    // call to draw chkchkboom
    drawChart(example_songs[0], widthSvg);

    window.addEventListener('scroll', () => {
      if (isElementInViewport(supershy) && !boolsupershy) {
          boolsupershy = true;
          // console.log("im super shy super shy");
          document.getElementById("tracktitle").innerHTML = "Super Shy";
          document.getElementById("trackartist").innerHTML = "New Jeans"
          document.getElementById("lasttime").innerHTML = "02:35";
          drawChart(example_songs[1], widthSvg);
          return false;
      }

      if(isElementInViewport(chkchkboom) && boolsupershy) {
        boolsupershy = false;
        // console.log("boom boom chk chk boom");
        document.getElementById("tracktitle").innerHTML = "Chk Chk Boom";
        document.getElementById("trackartist").innerHTML = "Stray Kids"
        document.getElementById("lasttime").innerHTML = "02:28";
        drawChart(example_songs[0], widthSvg);
        // return false;
      }

      if (isElementInViewport(tempo) && !booltempo) {
          booltempo = true;
          // console.log("im super shy super shy");
          document.getElementById("tracktitle").innerHTML = "Tempo";
          document.getElementById("trackartist").innerHTML = "EXO"
          document.getElementById("lasttime").innerHTML = "03:44";
          drawChart(example_songs[2], widthSvg);
          return false;
      }

      if(isElementInViewport(supershy) && booltempo) {
        booltempo = false;
        // console.log("boom boom chk chk boom");
        document.getElementById("tracktitle").innerHTML = "Super Shy";
        document.getElementById("trackartist").innerHTML = "New Jeans"
        document.getElementById("lasttime").innerHTML = "02:35";
        drawChart(example_songs[1], widthSvg);
        // return false;
      }
      

    });

}

var acc = document.getElementsByClassName("accordion");
var i;

for (i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var panel = this.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  });
}

const genderCurves = document.querySelector("#genderCurves");
const genderIntro = document.querySelector("#genderIntro");
let boolGender = false;


function genderCurve() {
  d3.json("assets/data/full_data.json").then(data => {

    var girl_data = data.filter(d => d.gender == "Girl Group");
    var boy_data = data.filter(d => d.gender == "Boy Group");
  
    let girl_avg = parseInt(d3.mean(girl_data, d => d.duration_sec));
    let boy_avg = parseInt(d3.mean(boy_data, d => d.duration_sec));
  
    let girltime = [];
  
    for (let year = 2007; year <= 2024; year++) {
      let current_data = girl_data.filter(d => new Date(d.release_date).getFullYear() === year);
      let current_avg = parseInt(d3.mean(current_data, d => d.duration_sec));
      let current = {year, current_avg};
      girltime.push(current);
    }
    
    let boytime = [];
  
    for (let year = 2007; year <= 2024; year++) {
      let current_data = boy_data.filter(d => new Date(d.release_date).getFullYear() === year);
      let current_avg = parseInt(d3.mean(current_data, d => d.duration_sec));
      let current = {year, current_avg};
      boytime.push(current);
    }
  
    const svg = d3.select("#scatter-plot")
    .select("svg") 
    .select("g"); 
  
    // Scales (same as data)
    const x = d3.scaleTime()
    .domain([2007, 2024])
    .range([0, width]);
  
  
    const y = d3.scaleLinear()
      .domain([0, 400]).nice()
      .range([height, 0]);
  
    const line = d3.line()
      .curve(d3.curveCardinal.tension(0.2))
      .x(d => x(d.year))  
      .y(d => y(d.current_avg)); 
  
    let girlpath = svg.append("path")
        .data([girltime])
        .attr("class", "line")
        .attr("class", "genderCurve")
        .attr("z-index", 5)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("stroke", "#f781bf");
  
    const girllength = girlpath.node().getTotalLength(); 
    // Make the line appear wowza
    girlpath.attr("stroke-dasharray", girllength + " " + girllength)
        .attr("stroke-dashoffset", girllength)
          .transition()
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0)
          .duration(1200);
  
    let boypath = svg.append("path")
        .data([boytime])
        .attr("class", "line")
        .attr("class", "genderCurve")
        .attr("z-index", 5)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("stroke", "#984ea3");
  
    const boylength = boypath.node().getTotalLength(); 
    // Make the line appear wowza
    boypath.attr("stroke-dasharray", boylength + " " + boylength)
        .attr("stroke-dashoffset", boylength)
          .transition()
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0)
          .duration(1200);
  
    window.addEventListener('scroll', () => {
      if (isElementInViewport(genderIntro) && boolGender) {
        boolGender = false;
        svg.selectAll(".genderCurve").remove();
      }
      if (isElementInViewport(exploretab) && boolGender) {
        boolGender = false;
        svg.selectAll(".genderCurve").remove();
      }
    });
    
  }).catch(error => console.error("Error loading data:", error));
}

window.addEventListener('scroll', () => {
  if (isElementInViewport(genderCurves) && !boolGender) {
    boolGender = true;
    genderCurve();
  }
});