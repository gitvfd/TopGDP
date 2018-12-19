var width = 0.8*window.innerWidth;
var height = 0.65*window.innerHeight;
var marginLegend = { top: 15, right: 30, bottom: 10, left: 30 },
    widthLegend = Math.min(width, 350) - marginLegend.left - marginLegend.right,
    heightLegend = 30;

var margin = { top: 50, right: 200, bottom: 200, left: 75 };

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var color = d3.scaleSequential(d3.interpolateViridis)

var cfg = {
    strokeWidth: 15
};

var highlight = ["United States", "China","Greece","India"];


svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height + cfg.strokeWidth);

var x = d3.scaleLinear()
    .range([0, width]);

var y = d3.scaleLinear()
    .range([0, height]);


var widthLine= d3.scaleLinear()
    .range([ cfg.strokeWidth,1]);

var voronoi = d3.voronoi()
    .x(d => x(d.Year))
    .y(d => y(parseFloat(d.rank)))
    .extent([[-margin.left / 2, -margin.top / 2], [width + margin.right / 2, height + margin.bottom / 2]]);

var line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(parseFloat(d.rank)))
// Uncomment this to use monotone curve
     	.curve(d3.curveMonotoneX);

    
var gdpData=[];
var gdpCapData=[];

var yearMap = [];
var countryMap=[];


//Data to load
var urls = {
    gdp: "data/GDP.tsv",
    gdpCap: "data/GDPcap.tsv"
};

d3.queue()
    .defer(d3.tsv, urls.gdp)
    .defer(d3.tsv, urls.gdpCap)
    .await(loadData);

var countergdp=0;
var countergdpcap=0;

function loadData(err, gdpTemp, gdpCapTemp) {
    gdpTemp.forEach(function (d) {
        gdpData.push(d);
        countergdp++;
    })
    gdpCapTemp.forEach(function (d) {
        gdpCapData.push(d);
        countergdpcap++;
    })

    if (countergdp==gdpTemp.length && countergdpcap==gdpCapTemp.length){

        render(gdpData,20)
       
    }
}

function render(data, displayedTop){

    if (displayedTop>=20)
    cfg.strokeWidth=15;
    if (displayedTop == 30)
        cfg.strokeWidth = 10;
    if (displayedTop == 40)
        cfg.strokeWidth = 5;
    
    widthLine.range([cfg.strokeWidth, 1]);

    d3.selectAll(".temp").remove()
        .transition()
        .duration(0);

    d3.select("#key").selectAll("*").remove()
        .transition()
        .duration(00);

    d3.select("#Widthkey").selectAll("*").remove()
        .transition()
        .duration(0);
    // Ranks
    var ranks = 20;
    y.domain([0.5, displayedTop]);

    yearMap = [];
    d3.map(data, function (d) { return d.Year; }).keys().forEach(function (d) { yearMap.push({ 'Year': d }); })

    var xTickNo = yearMap.length/5;
    
    x.domain(d3.extent(data, d => d.Year));

    widthLine.domain([1, ranks]);

    var axisMargin = 20;

    var xAxis = d3.axisBottom(x)
        .tickFormat(d3.format("d"))
        .ticks(xTickNo)
        .tickSize(0);

    var yAxis = d3.axisLeft(y)
        .ticks(ranks)
        .tickSize(0);

    var xGroup = svg.append("g");

    var xAxisElem = xGroup.append("g")
        .attr("transform", "translate(" + [0, height + axisMargin * 1.2] + ")")
        .attr("class", "x-axis temp")
        .call(xAxis);

    xGroup.append("g").selectAll("line")
        .data(x.ticks(xTickNo))
        .enter().append("line")
        .attr("class", "grid-line temp")
        .attr("y1", 0)
        .attr("y2", height + 10)
        .attr("x1", d => x(d))
        .attr("x2", d => x(d));

    var yGroup = svg.append("g");

    var yAxisElem = yGroup.append("g")
        .attr("transform", "translate(" + [-axisMargin, 0] + ")")
        .attr("class", "y-axis temp")
        .call(yAxis);

    yAxisElem.append("text")
        .attr("class", "y-label temp")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90) translate(" + [-height / 2, -margin.left / 2] + ")")
        .text("Ranking");

    yGroup.append("g").selectAll("line")
        .data(y.ticks(ranks))
        .enter().append("line")
        .attr("class", "grid-line temp")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d));
    

    d3.map(data, function (d) { return d.Country; }).keys().forEach(function (d) { countryMap.push({ 'Country': d }); })


    var parsedData = [];
    countryMap.forEach(function (k) {
        var dObj = { Country: k.Country, ranks: [] }
        data.filter(function (d) { return k.Country == d.Country }).forEach(function(d){
            dObj.ranks.push({ Year: d.Year, rank: d.rank, Country: dObj, value:d.value });
        })
        parsedData.push(dObj);
    })


    var maxPosition = [];
    var maxValue = [];

    parsedData.forEach(function (k) {
            var minRank=1000;
            var maxValueTemp=0;
            k.ranks.forEach(function(v){
                if (parseFloat(v.rank) <=parseFloat(minRank))
                    minRank = parseFloat(v.rank);
                if (parseFloat(v.value) >= parseFloat(maxValueTemp))
                    maxValueTemp = parseFloat(v.value);
            })
            maxPosition.push({"Country":k.Country,"maxPos":minRank})
            maxValue.push({ "Country": k.Country, "maxVal": maxValueTemp })
    })

    color.domain([d3.extent(maxValue.map(d => parseFloat(d.maxVal)))[1], d3.extent(maxValue.map(d => parseFloat(d.maxVal)))[0]]);

    var lines=svg.append("g")
            .selectAll("path")
            .data(parsedData)
            .enter().append("path")
            .attr("class", "rank-line temp")
            .attr("d", function (d) { d.line = this; return line(d.ranks);})
            .attr("clip-path", "url(#clip)")
            .style("stroke", function (d) {
                var maxValTemp;
                maxValue.forEach(function (k) {
                    if (k.Country == d.Country)
                        maxValTemp = k.maxVal;
                })
                return color(maxValTemp);
            })
            .style("stroke-width", function (d) { 
                var maxRank;
                maxPosition.forEach(function(k){
                    if(k.Country==d.Country)
                    maxRank=k.maxPos;
                })
                return widthLine(maxRank);
             })
            .style("opacity", 0.4)
            .transition()
            .duration(500)
            .delay(d => (highlight.indexOf(d.Country) + 1) * 500)
            .style("opacity", d => highlight.includes(d.Country) ? 1 : 0.4);
 

    var endLabels = svg.append("g")
        .attr("class", "end-labels temp")
        .selectAll("text")
        .data(parsedData)
        .enter().append("text")
        .attr("class", "end-label temp")
        .attr("id", function (d) {
            return d.Country.replace(/[ ,.]/g , '') ;
        })
        .attr("x", d => x(d.ranks[d.ranks.length - 1].Year))
        .attr("y", d => y(d.ranks[d.ranks.length - 1].rank))
        .attr("dx", 20)
        .attr("dy", cfg.strokeWidth / 2)
        .text(d => d.Country)
        .style("opacity", 0)
        .transition()
        .duration(500)
        .delay(d => (highlight.indexOf(d.Country) + 1) * 500)
        .style("opacity", function (d) {
            var opacityLabel = 0;
            highlight.forEach(function (k) {
                if (k == d.Country)
                    opacityLabel = 1;
            })
            return opacityLabel;
        });

    var endDots = svg.append("g")
        .selectAll("circle")
        .data(parsedData)
        .enter().append("circle")
        .attr("class", "end-circle temp")
        .attr("id",function(d){
            return d.Country.replace(/[ ,.]/g, '');
        })
        .attr("cx", d => x(d.ranks[d.ranks.length - 1].Year))
        .attr("cy", d => y(d.ranks[d.ranks.length - 1].rank))
        .attr("r", cfg.strokeWidth)
        .style("fill", function (d) {
            var maxValTemp;
            maxValue.forEach(function (k) {
                if (k.Country == d.Country)
                    maxValTemp = k.maxVal;
            })
            return color(maxValTemp);
        })
        .style("opacity", 0)
        .transition()
        .duration(500)
        .style("opacity", function(d){
            var opacityCircle=0;
            highlight.forEach(function(k){
                if(k==d.Country)
                    opacityCircle=1;
            
            })
            return opacityCircle;
        });


    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "20")
        .style("visibility", "hidden")
        .style("color", "#474747")
        .style("padding", "8px")
        .style("background-color", "#ffffff")
        .style("border-radius", "4px")
        .style("font", "11")
        .style("font-family", 'Open Sans')
        .style("text-anchor", "middle")
        .text("");

    var mousemove = function () {
        return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
    }

    var mouseout = function () {
        svg.selectAll(".rank-line").style("opacity", d => highlight.includes(d.Country) ? 1 : 0.4);

        

        svg.selectAll(".end-label").style("opacity", 0);
        svg.selectAll(".end-circle").style("opacity", 0);
        highlight.forEach(function(k){
            var classLabel = "#" + k.replace(/[ ,.]/g, '');
            var classCircle = "#" + k.replace(/[ ,.]/g, '');
            
            svg.selectAll(classLabel).style("opacity", 1);
            svg.selectAll(classCircle).style("opacity", 1);

        })
        
        return tooltip.style("visibility", "hidden"); 
    } 



    var voronoiGroup = svg.append("g")
        .attr("class", "voronoi temp");

    voronoiGroup.selectAll("path")
        .data(voronoi.polygons(d3.merge(parsedData.map(d => d.ranks))))
        .enter().append("path")
        .attr("d", function (d) { return d ? "M" + d.join("L") + "Z" : null; })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseout", mouseout);

    svg.selectAll(".rank-line")
        .each(d => highlight.includes(d.Country) ? d.line.parentNode.appendChild(d.line) : 0);

    svg.select("g.end-labels").raise();

    function mouseover(d) {
        tooltip.html("<b>" + d.data.Country.Country + "</b> (" + d.data.Year + ")<br><i>rank</i>: " + d.data.rank + "<br><i>value</i>: " + d3.format(",.2s")(d.data.value) + " USD");// or d3.format(",.2r")
        tooltip.style("visibility", "visible");

        var classLabel = "#" + d.data.Country.Country.replace(/[ ,.]/g, '')  ;
        var classCircle = "#" + d.data.Country.Country.replace(/[ ,.]/g, '');

        // Hide labels and dots from initial animation
        svg.selectAll(".end-label").style("opacity", 0);
        svg.selectAll(".end-circle").style("opacity", 0);

        svg.selectAll(classLabel).style("opacity", 1);
        svg.selectAll(classCircle).style("opacity", 1);

        

        svg.selectAll(".rank-line").style("opacity", 0.1);
        d3.select(d.data.Country.line).style("opacity", 1);
        d.data.Country.line.parentNode.appendChild(d.data.Country.line);
    }

    var viviridRange = ["#440154", "#440256", "#450457", "#450559", "#46075a", "#46085c", "#460a5d", "#460b5e", "#470d60", "#470e61", "#471063", "#471164", "#471365", "#481467", "#481668", "#481769", "#48186a", "#481a6c", "#481b6d", "#481c6e", "#481d6f", "#481f70", "#482071", "#482173", "#482374", "#482475", "#482576", "#482677", "#482878", "#482979", "#472a7a", "#472c7a", "#472d7b", "#472e7c", "#472f7d", "#46307e", "#46327e", "#46337f", "#463480", "#453581", "#453781", "#453882", "#443983", "#443a83", "#443b84", "#433d84", "#433e85", "#423f85", "#424086", "#424186", "#414287", "#414487", "#404588", "#404688", "#3f4788", "#3f4889", "#3e4989", "#3e4a89", "#3e4c8a", "#3d4d8a", "#3d4e8a", "#3c4f8a", "#3c508b", "#3b518b", "#3b528b", "#3a538b", "#3a548c", "#39558c", "#39568c", "#38588c", "#38598c", "#375a8c", "#375b8d", "#365c8d", "#365d8d", "#355e8d", "#355f8d", "#34608d", "#34618d", "#33628d", "#33638d", "#32648e", "#32658e", "#31668e", "#31678e", "#31688e", "#30698e", "#306a8e", "#2f6b8e", "#2f6c8e", "#2e6d8e", "#2e6e8e", "#2e6f8e", "#2d708e", "#2d718e", "#2c718e", "#2c728e", "#2c738e", "#2b748e", "#2b758e", "#2a768e", "#2a778e", "#2a788e", "#29798e", "#297a8e", "#297b8e", "#287c8e", "#287d8e", "#277e8e", "#277f8e", "#27808e", "#26818e", "#26828e", "#26828e", "#25838e", "#25848e", "#25858e", "#24868e", "#24878e", "#23888e", "#23898e", "#238a8d", "#228b8d", "#228c8d", "#228d8d", "#218e8d", "#218f8d", "#21908d", "#21918c", "#20928c", "#20928c", "#20938c", "#1f948c", "#1f958b", "#1f968b", "#1f978b", "#1f988b", "#1f998a", "#1f9a8a", "#1e9b8a", "#1e9c89", "#1e9d89", "#1f9e89", "#1f9f88", "#1fa088", "#1fa188", "#1fa187", "#1fa287", "#20a386", "#20a486", "#21a585", "#21a685", "#22a785", "#22a884", "#23a983", "#24aa83", "#25ab82", "#25ac82", "#26ad81", "#27ad81", "#28ae80", "#29af7f", "#2ab07f", "#2cb17e", "#2db27d", "#2eb37c", "#2fb47c", "#31b57b", "#32b67a", "#34b679", "#35b779", "#37b878", "#38b977", "#3aba76", "#3bbb75", "#3dbc74", "#3fbc73", "#40bd72", "#42be71", "#44bf70", "#46c06f", "#48c16e", "#4ac16d", "#4cc26c", "#4ec36b", "#50c46a", "#52c569", "#54c568", "#56c667", "#58c765", "#5ac864", "#5cc863", "#5ec962", "#60ca60", "#63cb5f", "#65cb5e", "#67cc5c", "#69cd5b", "#6ccd5a", "#6ece58", "#70cf57", "#73d056", "#75d054", "#77d153", "#7ad151", "#7cd250", "#7fd34e", "#81d34d", "#84d44b", "#86d549", "#89d548", "#8bd646", "#8ed645", "#90d743", "#93d741", "#95d840", "#98d83e", "#9bd93c", "#9dd93b", "#a0da39", "#a2da37", "#a5db36", "#a8db34", "#aadc32", "#addc30", "#b0dd2f", "#b2dd2d", "#b5de2b", "#b8de29", "#bade28", "#bddf26", "#c0df25", "#c2df23", "#c5e021", "#c8e020", "#cae11f", "#cde11d", "#d0e11c", "#d2e21b", "#d5e21a", "#d8e219", "#dae319", "#dde318", "#dfe318", "#e2e418", "#e5e419", "#e7e419", "#eae51a", "#ece51b", "#efe51c", "#f1e51d", "#f4e61e", "#f6e620", "#f8e621", "#fbe723", "#fde725"]

    var colorLegend = d3.select("#key").append("svg")
        .attr("width", widthLegend + marginLegend.left + marginLegend.right)
        .attr("height", heightLegend + marginLegend.top + marginLegend.bottom)
        .append("g")
        .attr("class", "colorLegendWrapper")
        .attr("transform", "translate(" + marginLegend.left + "," + marginLegend.top + ")");
    
        var legendGradient = colorLegend.append("defs")
        .append("linearGradient")
        .attr("id", "legendGradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%")
        .attr("spreadMethod", "pad")
        .selectAll("stop")
        .data(viviridRange)
        .enter().append("stop")
        .attr("offset", function (d, i) { return Math.floor((i) * 100 / (viviridRange.length+50) ) + "%";  })
        .attr("stop-color", function (d) { return d; });

    //Create the rectangle to be filled with color	
    colorLegend.append("rect")
        .attr("class", "colorkey")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", widthLegend)
        .attr("height", 16)
        .style("opacity", 1)
        .attr("fill", "url(#legendGradient)");

    //Append the A, Z and explanation around the rectangle
    colorLegend.append("text")
        .attr("x", 0)
        .attr("y", 28)
        .style("font-size", 11)
        .style("text-anchor", "middle")
        .text(d3.format(",.2s")(d3.max(maxValue, function (d) { return parseFloat(d.maxVal); })) +" USD")
    colorLegend.append("text")
        .attr("x", widthLegend)
        .attr("y", 28)
        .style("font-size", 11)
        .style("text-anchor", "middle")
        .text(d3.format(",.2s")(d3.min(maxValue, function (d) { return parseFloat(d.maxVal); })) + " USD");


    var barLegend = d3.select("#Widthkey").append("svg")
        .attr("width", widthLegend + marginLegend.left + marginLegend.right)
        .attr("height", heightLegend + marginLegend.top + marginLegend.bottom)
        .append("g")
        .attr("class", "widthWrapper")
        .attr("transform", "translate(" + marginLegend.left + "," + marginLegend.top + ")");

    var widthRange=[1,3,6,9,12,15,18,20]
    barLegend.append("g")
        .selectAll("rect")
        .data(widthRange)
        .enter().append("rect")
        .attr("class", "rectKey")
        .attr("x", function (d, i) { return (widthLegend / (2 * (widthRange.length )) + i * widthLegend/(widthRange.length))})
        .attr("y", function (d) { return heightLegend - widthLine(d);})
        .attr("width", function(){return widthLegend / (2 * (widthRange.length ))})
        .attr("height", function (d) {return widthLine(d); });
    barLegend.append("g")
        .selectAll("text")
        .data(widthRange)
        .enter().append("text")
        .style("font-size", 11)
        //.style("text-anchor", "end")
        .attr("x", function (d, i) { return (1.25*widthLegend / (2 * (widthRange.length)) + i * widthLegend / (widthRange.length)) })
        .attr("y", function (d) { return heightLegend - widthLine(d)-5; })
        .text(function(d){return d;})

}


var slider = document.getElementById("myRange");
var output = document.getElementById("valueSlider");
output.innerHTML = slider.value;

slider.oninput = function () {
    output.innerHTML = this.value;
    render(gdpData, this.value);
}


d3.select("#gdp").on("click", function (e) { 
    document.getElementById("indicator").innerHTML="GDP";
    render(gdpData, document.getElementById("myRange").value);
});
d3.select("#gdpcap").on("click", function (e) {
    document.getElementById("indicator").innerHTML= "GDP per capita";
    render(gdpCapData, document.getElementById("myRange").value) ;
});
