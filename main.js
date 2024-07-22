let currentScene = 4
var width = 600
var height = 400
let margin = {top: 10, right: 30, bottom: 30, left: 40}
var fillColor = "rgb(191,219,213)"
let regression_line_status = false
let pathColor = "#fc9e60"

d3.csv("dataset/Sleep_health_and_lifestyle_dataset.csv").then(data => {
  window.sleepData = data;
  console.log(sleepData)
  drawScene(currentScene)
})

function drawScene(sceneIndex) {
  console.log(currentScene)
  d3.select("#visualization").html("")
  d3.select("#scene_header").html("")
  let intro = document.getElementsByClassName("intro-container")
  let visualization = document.getElementById("multiple_scenes")
  let start = document.getElementById("start")
  let prev = document.getElementById("prev")
  let next = document.getElementById("next")
  regression_line_status = false

  if (sceneIndex == 0) {
    intro[0].style.display = "flex"
    visualization.display = "none"
    prev.style.display = "none"
    next.style.display = "none"
    start.style.display = "inline-block"
  }
  else {
    intro[0].style.display = "none"
    visualization.display = "block"
    prev.style.display = "inline-block"
    next.style.display = "inline-block"
    start.style.display = "none"
    switch (sceneIndex) {
    case 1:
      drawQualityHistogram()
      break
    case 2:
      drawSleepFactor()
      break
    case 3:
      drawMentalFactor()
      break
    case 4:
      drawHeartRateWithSleepDisorder()
      break
    }
  }
}

document.getElementById("prev").addEventListener("click", () => {
  currentScene = (currentScene - 1) % 5;
  drawScene(currentScene);
})

document.getElementById("next").addEventListener("click", () => {
  currentScene = (currentScene + 1) % 5;
  drawScene(currentScene);
})

document.getElementById("start").addEventListener("click", () => {
  currentScene += 1
  drawScene(currentScene);
})


function findLineByLeastSquares(values_x, values_y) {
  var sum_x = 0;
  var sum_y = 0;
  var sum_xy = 0;
  var sum_xx = 0;
  var count = 0;

  /*
   * We'll use those variables for faster read/write access.
   */
  var x = 0;
  var y = 0;
  var values_length = values_x.length;

  if (values_length != values_y.length) {
      throw new Error('The parameters values_x and values_y need to have same size!');
  }

  /*
   * Nothing to do.
   */
  if (values_length === 0) {
      return [ [], [] ];
  }

  /*
   * Calculate the sum for each of the parts necessary.
   */
  for (var v = 0; v < values_length; v++) {
      x = values_x[v];
      y = values_y[v];
      sum_x += x;
      sum_y += y;
      sum_xx += x*x;
      sum_xy += x*y;
      count++;
  }

  /*
   * Calculate m and b for the formular:
   * y = x * m + b
   */
  var m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
  var b = (sum_y/count) - (m*sum_x)/count;

  /*
   * We will make the x and y result line now
   */
  var result_values_x = [];
  var result_values_y = [];

  for (var v = 0; v < values_length; v++) {
      x = values_x[v];
      y = x * m + b;
      result_values_x.push(x);
      result_values_y.push(y);
  }

  return [result_values_x, result_values_y];
}

function drawQualityHistogram() {

  let header_contianer = document.getElementById("scene_header")
  header_contianer.innerHTML = `
     <h2>Overview of Sleep Quality</h2>
     <p>The distribution of sleep quality among individuals is a crucial metric to understand 
     the general sleep patterns within a population. In this scene, we present a histogram that 
     displays how many people fall into various sleep quality categories. The rating is subjective and ranges from 1 to 10.</p>
     <p>Hovering the mouse over the 
     corresponding rectangle on the chart reveals detailed information about the exact number of 
     people who gave that rating. 
     </p>
  `
  console.log("draw quality overview")
  let svg = d3.select("#visualization")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(40, 10)")
  
  let tooltip = d3.select("#visualization")
  .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)

  const x = d3.scaleLinear()
    .domain([1, 10])
    .range([0, window.width])
  
  svg.append("g")
    .attr("transform", `translate(0,${window.height})`)
    .attr("class", "axis")
    .call(d3.axisBottom(x))
  
  const histogram = d3.histogram()
    .value(d => d["Quality of Sleep"])
    .domain(x.domain())
    .thresholds(x.ticks(10))
  
  const bins = histogram(window.sleepData)
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .range([window.height, 0])

  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y))
  
  svg.selectAll("rect")
    .data(bins)
    .join("rect")
      .attr("x", 1)
    .attr("transform", data =>`translate(${x(data.x0)}, ${y(data.length)})`)
    .attr("width", data => x(data.x1) - x(data.x0) - 1)
    .attr("height", data => window.height - y(data.length))
    .style("fill", window.fillColor)
    .on("mouseover", (event, d) => {
      tooltip.transition()
        .duration(50)
        .style("opacity", 0.9)
      tooltip.html(`${d.length} people with sleep quality rating ${d.x0}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px")
    })
    .on("mousemove", (event, d) => {
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9)
      tooltip.html(`${d.length} people with sleep quality rating ${d.x0}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px")
    })
    .on("mouseout", () => {
      tooltip.transition()
        .duration(200)
        .style("opacity", 0)
    })

  let text_x = 2
  let text_y = 80
  
  svg.append("text")
    .attr("y", y(text_y))
    .attr("x", x(text_x))
    .attr("fill", "#fc9e60")
    .attr("font-size", "19px")
    .attr("stroke-width", "2px")
    .text("Most people rate their");
  
  svg.append("text")
    .attr("y", y(text_y - 5))
    .attr("x", x(text_x))
    .attr("fill", "#fc9e60")
    .attr("font-size", "19px")
    .attr("stroke-width", "2px")
    .text("sleep quality as 8");
  
  svg.append("text")
    .attr("y", y(text_y - 10))
    .attr("x", x(text_x))
    .attr("fill", "#fc9e60")
    .attr("font-size", "19px")
    .attr("stroke-width", "2px")
    .text("followed by a rating of 6.");
}

function drawSleepFactor() {
  console.log("draw lifestyle factor")

  let header_contianer = document.getElementById("scene_header")
  header_contianer.innerHTML = `
     <h2>Impact of Physical Activity on Sleep Quality</h2>
     <p>This scene delves into the relationship between physical activity levels and sleep quality. 
     Using a scatter plot, we visualize how different levels of physical activity correlate with 
     the sleep quality individuals report. The level of physical activity is measured by the number of 
     minutes a person engages in physical activity daily. The radius of each scatter point is scaled 
     according to the number of people with the same level of physical activity and the same sleep quality 
     rating. 
     </p>
     <p>Hovering the mouse over the 
     corresponding circle on the chart reveals detailed information about the exact number of 
     people who has that level of physical activity and gave that rating. 
     </p>
  `

  header_contianer.innerHTML += `
    <div class="checkbox-wrapper-14">
      <input id="s1-14" type="checkbox" class="switch regression_line1">
      <label for="s1-14">Show the regression line to see the trend</label>
    </div>
  `

  let svg = d3.select("#visualization")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(40, 10)")
  
  let tooltip = d3.select("#visualization")
  .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)

  const x = d3.scaleLinear()
    .domain([20, d3.max(window.sleepData, d => d["Physical Activity Level"])])
    .range([0, window.width])
    
  
  svg.append("g")
    .attr("transform", `translate(0,${window.height})`)
    .call(d3.axisBottom(x))
    .attr("class", "axis")
  
  const y = d3.scaleLinear()
    .domain([1, 10])
    .range([window.height, 0])
  
  svg.append("g")
    .call(d3.axisLeft(y))
    .attr("class", "axis")
  
  const activitySleepData = d3.rollup(window.sleepData,
    v => v.length,
    d => d["Physical Activity Level"],
    d => d["Quality of Sleep"]
  )

  const flatData = []
  activitySleepData.forEach((v, k1) => {
    v.forEach((cnt, k2) => {
      flatData.push({physical_activity: k1, sleep_quality: k2, count: cnt})
    })
  })

  const x_value = []
  window.sleepData.forEach((elem) => x_value.push(parseInt(elem["Physical Activity Level"])))
  const y_value = []
  window.sleepData.forEach((elem) => y_value.push(parseInt(elem["Quality of Sleep"])))
  const results = findLineByLeastSquares(x_value, y_value)
  let regression_line = []
  for (let i=0; i<results[0].length; i++) {
    regression_line.push({pa: results[0][i], rating: results[1][i]})
  }

  const r = d3.scaleLinear()
    .domain([0, d3.max(flatData, d => d.count)])
    .range(([7, 30]))
  
  svg.append("g")
    .selectAll("dot")
    .data(flatData)
    .enter()
    .append("circle")
      .attr("cx", d => x(d.physical_activity) + (Math.random() - 0.5) * 10)
      .attr("cy", d => y(d.sleep_quality) + (Math.random() - 0.5) * 10)
      .attr("r", d => r(d.count))
      .style("fill", fillColor)
      .attr("class", "activity_cicle line_not_show")
    .on("mouseover", (event, d) => {
      tooltip.transition()
        .duration(50)
        .style("opacity", 0.9)
      tooltip.html(`${d.count} people with sleep quality rating ${d.sleep_quality} and physical activity level ${d.physical_activity}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px")
    })
    .on("mousemove", (event, d) => {
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9)
      tooltip.html(`${d.count} people with sleep quality rating ${d.sleep_quality} and physical activity level ${d.physical_activity}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px")
    })
    .on("mouseout", () => {
      tooltip.transition()
        .duration(200)
        .style("opacity", 0)
    })
  
  svg.append("path")
    .attr("id", "PA_regression_line")
    .datum(regression_line)
    .attr("fill", "none")
    .attr("stroke", pathColor)
    .attr("stroke-width", 4)
    .attr("style", "visibility: hidden")
    .attr("d", d3.line().x(d => x(d.pa)).y(d => y(d.rating)))
  
  let text_x = d3.max(window.sleepData, d => d["Physical Activity Level"] - 60)
  let text_y = 6
  
  svg.append("text")
    .attr("y", y(text_y))
    .attr("x", x(text_x))
    .attr("fill", "#fc9e60")
    .attr("font-size", "19px")
    .attr("stroke-width", "2px")
    .attr("class", "myLabel")
    .attr("style", "visibility: hidden")
    .text("The regression line here is flat showing that");
   
  svg.append("text")
    .attr("y", y(text_y - 0.5))
    .attr("x", x(text_x))
    .attr("fill", "#fc9e60")
    .attr("font-size", "19px")
    .attr("stroke-width", "2px")
    .attr("class", "myLabel")
    .attr("style", "visibility: hidden")
    .text("physical activity has very small positive effect to sleep quality");

  let line = document.getElementById("PA_regression_line")
  let circles = document.getElementsByClassName("activity_cicle")
  let text = document.getElementsByClassName("myLabel")

  document.getElementsByClassName("regression_line1")[0].addEventListener("click", () => {
    regression_line_status = !regression_line_status
    if (regression_line_status == true) {
      line.style.visibility = "visible"
      for (i of circles) {
        i.classList.replace("line_not_show", "line_show")
      }
      for (i of text) {
        i.style.visibility = "visible"
      }
    }
    else {
      line.style.visibility = "hidden"
      for (i of circles) {
        i.classList.replace("line_show","line_not_show")
      }
      for (i of text) {
        i.style.visibility = "hidden"
      }
    }
  })


}

function drawMentalFactor() {
  console.log("draw mental factor")
  let svg = d3.select("#visualization")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(40, 10)")
  
  let tooltip = d3.select("#visualization")
  .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
  const x = d3.scaleLinear()
    .domain([2, 10])
    .range([0, window.width])
  
    let header_contianer = document.getElementById("scene_header")
    header_contianer.innerHTML = `
      <h2>Impact of Stress Level on Sleep Quality</h2>
      <p>The third scene examines the connection between mental health and sleep quality. By 
      plotting mental health scores against sleep quality, we aim to uncover how psychological 
      well-being affects sleep patterns. The level of stress is a subjective rating experienced by the person, ranging from 1 to 10. 
      The radius of each scatter point is scaled according to the number of people with the same level of physical activity and the same sleep quality 
      rating. 
      </p>
      <p>Hovering the mouse over the 
      corresponding circle on the chart reveals detailed information about the exact number of 
      people who has that level of stress and gave that rating. 
      </p>
    `
  
  header_contianer.innerHTML += `
    <div class="checkbox-wrapper-14">
      <input id="s1-14" type="checkbox" class="switch regression_line2">
      <label for="s1-14">Show the regression line to see the trend</label>
    </div>
  `

  svg.append("g")
    .attr("transform", `translate(0,${window.height})`)
    .call(d3.axisBottom(x))
    .attr("class", "axis")
  
  const y = d3.scaleLinear()
    .domain([3, 10])
    .range([window.height, 0])
  
  svg.append("g")
    .call(d3.axisLeft(y))
    .attr("class", "axis")

  const stressSleepData = d3.rollup(window.sleepData,
    v => v.length,
    d => d["Stress Level"],
    d => d["Quality of Sleep"]
  )

  const flatData = []
  stressSleepData.forEach((v, k1) => {
    v.forEach((cnt, k2) => {
      flatData.push({stress_level: k1, sleep_quality: k2, count: cnt})
    })
  })

  const x_value = []
  window.sleepData.forEach((elem) => x_value.push(parseInt(elem["Stress Level"])))
  const y_value = []
  window.sleepData.forEach((elem) => y_value.push(parseInt(elem["Quality of Sleep"])))
  const results = findLineByLeastSquares(x_value, y_value)
  let regression_line = []
  for (let i=0; i<results[0].length; i++) {
    regression_line.push({stress: results[0][i], rating: results[1][i]})
  }

  const r = d3.scaleLinear()
    .domain([0, d3.max(flatData, d => d.count)])
    .range(([7, 30]))
  
  svg.append("g")
    .selectAll("circle")
    .data(flatData)
    .enter()
    .append("circle")
      .attr("cx", d => x(d.stress_level) + (Math.random() - 0.5) * 10)
      .attr("cy", d => y(d.sleep_quality) + (Math.random() - 0.5) * 10)
      .attr("r", d => r(d.count))
      .attr("opacity", 1)
      .style("fill", fillColor)
      .attr("class", "stress_cicle line_not_show")
    .on("mouseover", (event, d) => {
      tooltip.transition()
        .duration(50)
        .style("opacity", 0.9)
      tooltip.html(`${d.count} people with sleep quality rating ${d.sleep_quality} and stress level ${d.stress_level}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px")
    })
    .on("mousemove", (event, d) => {
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9)
      tooltip.html(`${d.count} people with sleep quality rating ${d.sleep_quality} and stress level ${d.stress_level}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px")
    })
    .on("mouseout", () => {
      tooltip.transition()
        .duration(200)
        .style("opacity", 0)
    })
  
  svg.append("path")
    .datum(regression_line)
    .attr("fill", "none")
    .attr("id", "stress_regression_line")
    .attr("stroke", pathColor)
    .attr("stroke-width", 4)
    .attr("style", "visibility: hidden")
    .attr("d", d3.line().x(d => x(d.stress)).y(d => y(d.rating)))

  let text_x = d3.max(window.sleepData, d => d["Stress Level"] - 2.5)
  let text_y = 8
  
  svg.append("text")
    .attr("y", y(text_y))
    .attr("x", x(text_x))
    .attr("fill", "#fc9e60")
    .attr("font-size", "19px")
    .attr("stroke-width", "2px")
    .attr("class", "myLabel")
    .attr("style", "visibility: hidden")
    .text("The regression line showing that the stress level is ");
    
  svg.append("text")
    .attr("y", y(text_y - 0.5))
    .attr("x", x(text_x))
    .attr("fill", "#fc9e60")
    .attr("font-size", "19px")
    .attr("stroke-width", "2px")
    .attr("class", "myLabel")
    .attr("style", "visibility: hidden")
    .text("negatively correlated with sleep quality");
  
  let line = document.getElementById("stress_regression_line")
  let circles = document.getElementsByClassName("stress_cicle")
  let text = document.getElementsByClassName("myLabel")
  
  document.getElementsByClassName("regression_line2")[0].addEventListener("click", () => {
    regression_line_status = !regression_line_status
    if (regression_line_status == true) {
      line.style.visibility = "visible"
      for (i of circles) {
        i.classList.replace("line_not_show", "line_show")
      }
      for (i of text) {
        i.style.visibility = "visible"
      }
    }
    else {
      line.style.visibility = "hidden"
      for (i of circles) {
        i.classList.replace("line_show","line_not_show")
      }
      for (i of text) {
        i.style.visibility = "hidden"
      }
    }
  })
}

function drawHeartRateWithSleepDisorder() {
  let info = [
    {sleepDisorder: "Sleep Apnea", cnt: 0, avg: 0, min: 500, max: 0, sum: 0},
    {sleepDisorder: "None", cnt: 0, avg: 0, min: 500, max: 0, sum: 0 },
    {sleepDisorder: "Insomnia", cnt: 0, avg: 0, min: 500, max: 0, sum: 0 },
  ]
  let record_key = {"Sleep Apnea": 0, "Insomnia": 2, "None": 1}

  for (let obj of window.sleepData) {
    let curr = info[record_key[obj["Sleep Disorder"]]]
    curr.cnt += 1
    let bpm = parseInt(obj["Heart Rate"])
    curr.sum += bpm
    if (bpm > curr.max) {
      curr.max = bpm
    }
    if (bpm < curr.min) {
      curr.min = bpm
    }
  }
  for (let i=0; i<3; i++) {
    info[i].avg = info[i].sum / info[i].cnt
  }

  let svg = d3.select("#visualization")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(40, 10)")
  
  let tooltip = d3.select("#visualization")
    .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
  
  let header_contianer = document.getElementById("scene_header")
  header_contianer.innerHTML = `
      <h2>How Sleep Quality Affect Resting Heart Rate</h2>
      <p>
      This scene examines the relationship between different types of sleep 
      disorders and resting heart rate. A lower resting heart rate typically means a better
      heart health. By comparing the average resting heart rates 
      across various sleep disorders, this visualization aims to uncover potential
      physiological impacts of sleep disorders on heart health. The resting heart rate of the person 
      is measured in beats per minute.
      </p>
      <p>
      In this chart, the line plots the average of heart rate while shaded areas represents confidence intervals of that
      between three diferent types of sleep diorder: sleep apnea, none, and insomnia.
      </p>
  `

  const x = d3.scalePoint()
    .domain(["Sleep Apnea", "None", "Insomnia"])
    .range([0, window.width])
    
  
  svg.append("g")
    .attr("transform", `translate(0,${window.height})`)
    .call(d3.axisBottom(x))
    .attr("class", "axis")

  const y = d3.scaleLinear()
    .domain([d3.min(info, d => d.min) - 1, d3.max(info, d => d.max) + 1])
    .nice()
    .range([window.height, 0])
  
  svg.append("g")
    .call(d3.axisLeft(y))
    .attr("class", "axis")
  
  const area = d3.area()
    .x(d => x(d.sleepDisorder))
    .y0(d => y(d.min))
    .y1(d => y(d.max))
  
  const line = d3.line()
    .x(d => x(d.sleepDisorder))
    .y(d => y(d.avg))
  
  svg.append("path")
    .datum(info)
    .attr("fill", fillColor)
    .attr("opacity", 0.2)
    .attr("d", area)
  
  svg.append("path")
    .datum(info)
    .attr("fill", "none")
    .attr("stroke", fillColor)
    .attr("stroke-width", 2)
    .attr("d", line)
  
  let text_x = "None"
  let text_y = 74
  
  svg.append("text")
    .attr("y", y(text_y))
    .attr("x", x(text_x))
    .attr("fill", "#fc9e60")
    .attr("font-size", "19px")
    .attr("stroke-width", "2px")
    .text("Sleep disorder results in");
  
  svg.append("text")
    .attr("y", y(text_y - 1.2))
    .attr("x", x(text_x))
    .attr("fill", "#fc9e60")
    .attr("font-size", "19px")
    .attr("stroke-width", "2px")
    .text("a higher average resting heart rate");
  
}
